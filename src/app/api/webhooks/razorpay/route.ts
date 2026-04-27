// src/app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { WhatsAppService } from '@/lib/whatsapp.service'

// Serverless Rate Limiter (Falls back to bypassed if Redis env vars are missing during local dev)
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    })
  : null

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  // Rate limiting
  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(`razorpay_webhook_${clientIp}`)
    if (!success) {
      console.warn(`[WEBHOOK] Rate limit exceeded for IP: ${clientIp}`)
      return NextResponse.json(
        { error: 'Too many requests', waitTime: Math.ceil((reset - Date.now()) / 1000) },
        { status: 429 }
      )
    }
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error('[WEBHOOK] Missing RAZORPAY_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error(`[WEBHOOK] Invalid signature from IP: ${clientIp}`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log(`[WEBHOOK] Received event: ${event.event} from IP: ${clientIp}`)

    // Use Admin Client to bypass RLS for Webhook
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[WEBHOOK] Missing Supabase env variables for admin client')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // ─── HANDLE PAYMENT CAPTURED ─────────────────────────────────────────────
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const { notes, method, id: razorpayPaymentId, order_id: razorpayOrderId, amount, currency } = payment
      const internalOrderId = notes?.internal_order_id

      console.log(`[WEBHOOK] Payment captured: order=${internalOrderId}, method=${method}, amount=${amount / 100} ${currency}`)

      if (!internalOrderId) {
        console.error('[WEBHOOK] No internal order ID in payment notes')
        return NextResponse.json({ error: 'Missing order reference' }, { status: 400 })
      }

      // 1. Update Order Status in Supabase
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
        .neq('payment_status', 'paid') // Prevent double-processing
        .select('*') 
        .single()

      if (updateError || !updatedOrder) {
        console.log(`[WEBHOOK] Order ${internalOrderId} already marked as paid or not found, skipping`)
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      // 2. Update Product Stock
      const stockUpdateResult = await updateProductStock(internalOrderId, supabase)
      console.log(`[WEBHOOK] Stock update result: ${stockUpdateResult}`)

      // 3. Trigger WhatsApp Notifications (Fetching from addresses table)
      let customerPhone = null;
      let customerName = 'Customer';

      if (updatedOrder.address_id) {
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('phone, name')
          .eq('id', updatedOrder.address_id)
          .single();

        if (addressData && !addressError) {
          customerPhone = addressData.phone;
          customerName = addressData.name || 'Customer';
        }
      }

      const actualAmount = amount / 100; // Convert paise back to rupees

      // 🚨 ALWAYS ALERT ADMIN (Uncle Ismath) 🚨
      try {
        await WhatsAppService.sendAdminAlert("916383151922", internalOrderId, actualAmount, customerName);
        console.log(`[WEBHOOK] Admin alert dispatched for ${internalOrderId}`);
      } catch (e) {
        console.error(`[WEBHOOK] Admin WhatsApp failed:`, e);
      }

      // 👤 ALERT CUSTOMER 👤
      if (customerPhone) {
        const trackLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://razackpackagingcentre.com'}/order/${internalOrderId}`;
        try {
          await WhatsAppService.sendCustomerConfirmation(customerPhone, internalOrderId, trackLink);
          console.log(`[WEBHOOK] Customer confirmation dispatched to ${customerPhone}`);
        } catch (e) {
          console.error(`[WEBHOOK] Customer WhatsApp failed:`, e);
        }
      } else {
        console.warn(`[WEBHOOK] No phone number found in addresses for order ${internalOrderId}, skipped Customer message.`);
      }

      const duration = Date.now() - startTime
      console.log(`[WEBHOOK] Payment captured for order ${internalOrderId} took ${duration}ms`)
    }

    // ─── HANDLE PAYMENT FAILED ───────────────────────────────────────────────
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const { notes, error_description, error_reason, amount, currency } = payment
      const internalOrderId = notes?.internal_order_id

      console.log(`[WEBHOOK] Payment failed: order=${internalOrderId}, reason=${error_reason}, amount=${amount / 100} ${currency}`)

      if (internalOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', internalOrderId)
          .single()

        if (existingOrder?.payment_status === 'failed') {
          return NextResponse.json({ received: true, alreadyProcessed: true })
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'pending',
            payment_failed_reason: error_description || error_reason,
          })
          .eq('id', internalOrderId)

        if (updateError) {
          console.error(`[WEBHOOK] Failed to update order on payment failure:`, updateError)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
async function updateProductStock(orderId: string, supabase: any): Promise<string> {
  try {
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    if (itemsError) return 'failed - items fetch error'
    if (!orderItems || orderItems.length === 0) return 'no items'

    let successCount = 0
    let failCount = 0

    for (const item of orderItems) {
      const { error: rpcError } = await supabase.rpc('decrement_product_stock', {
        p_id: item.product_id,
        decrement_qty: item.quantity
      })

      if (rpcError) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()

        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity)
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id)

          if (stockError) failCount++
          else successCount++
        } else {
          failCount++
        }
      } else {
        successCount++
      }
    }

    return `updated: ${successCount} succeeded, ${failCount} failed`
  } catch (error) {
    console.error('[WEBHOOK] Error updating product stock:', error)
    return 'failed - exception'
  }
}