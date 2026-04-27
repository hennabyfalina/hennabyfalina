// src/app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { WhatsAppService } from '@/lib/whatsapp.service'

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })
  : null

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(`razorpay_webhook_${clientIp}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests', waitTime: Math.ceil((reset - Date.now()) / 1000) }, { status: 429 })
    }
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!secret || signature !== crypto.createHmac('sha256', secret).update(body).digest('hex')) {
      return NextResponse.json({ error: 'Invalid signature or config' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) return NextResponse.json({ error: 'Config error' }, { status: 500 })
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const { notes, method, id: razorpayPaymentId, order_id: razorpayOrderId, amount } = payment
      const internalOrderId = notes?.internal_order_id

      if (!internalOrderId) return NextResponse.json({ error: 'Missing order reference' }, { status: 400 })

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_method_detail: method,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', internalOrderId)
        .neq('payment_status', 'paid')
        .select('*') 
        .single()

      if (updateError || !updatedOrder) return NextResponse.json({ received: true, alreadyProcessed: true })

      await updateProductStock(internalOrderId, supabase)

      // ─── WHATSAPP DATA PREP ───
      let customerPhone = null;
      let customerName = 'Customer';

      if (updatedOrder.address_id) {
        const { data: addressData } = await supabase.from('addresses').select('phone, name').eq('id', updatedOrder.address_id).single();
        if (addressData) {
          customerPhone = addressData.phone;
          customerName = addressData.name || 'Customer';
        }
      }

      // Fetch Order Items
      const { data: itemsData } = await supabase.from('order_items').select('quantity, products(name)').eq('order_id', internalOrderId);
      let itemsList = '';
      if (itemsData && itemsData.length > 0) {
        itemsList = itemsData.map((item: any) => {
          const productName = Array.isArray(item.products) ? item.products[0]?.name : item.products?.name;
          return `• ${item.quantity}x ${productName || 'Item'}`;
        }).join('\n');
      }

      const actualAmount = amount / 100;
      const displayOrderNum = updatedOrder.order_number; // The RPC- number
      const trackLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://razackpackagingcentre.com'}/order/${internalOrderId}`;

      // SEND MESSAGES
      try {
        await WhatsAppService.sendAdminAlert("916383151922", displayOrderNum, actualAmount, customerName, itemsList);
      } catch (e) { console.error(e); }

      if (customerPhone) {
        try {
          await WhatsAppService.sendCustomerConfirmation(customerPhone, displayOrderNum, actualAmount, itemsList, trackLink);
        } catch (e) { console.error(e); }
      }
    }

    if (event.event === 'payment.failed') {
      const { notes, error_description, error_reason } = event.payload.payment.entity
      if (notes?.internal_order_id) {
        await supabase.from('orders').update({ payment_status: 'failed', status: 'pending', payment_failed_reason: error_description || error_reason }).eq('id', notes.internal_order_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function updateProductStock(orderId: string, supabase: any) {
  try {
    const { data: orderItems } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', orderId)
    if (!orderItems) return
    for (const item of orderItems) {
      const { error: rpcError } = await supabase.rpc('decrement_product_stock', { p_id: item.product_id, decrement_qty: item.quantity })
      if (rpcError) {
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
        if (product) await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.product_id)
      }
    }
  } catch (e) {}
}