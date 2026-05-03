// src/app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { notifyOrderConfirmed } from '@/services/whatsapp.service'

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })
  : null

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  
  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(`razorpay_webhook_${clientIp}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!secret || signature !== crypto.createHmac('sha256', secret).update(body).digest('hex')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Config error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const { notes, method, id: razorpayPaymentId, order_id: razorpayOrderId, amount } = payment
      const internalOrderId = notes?.internal_order_id
      const idempotencyKey = notes?.idempotency_key

      if (!internalOrderId) {
        return NextResponse.json({ error: 'Missing order reference' }, { status: 400 })
      }

      // ✅ FIX: Fetch current order state including payment_attempts
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, payment_status, razorpay_payment_id, payment_attempts')
        .eq('id', internalOrderId)
        .single()

      if (existingOrder?.payment_status === 'paid') {
        console.log(`[Webhook] Order ${internalOrderId} already paid. Skipping duplicate.`)
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      if (existingOrder?.razorpay_payment_id) {
        console.log(`[Webhook] Order ${internalOrderId} already has payment ID. Skipping.`)
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      const currentAttempts = existingOrder?.payment_attempts || 0

      // ✅ FIX: Use proper increment without .raw()
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_method_detail: method,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          paid_at: new Date().toISOString(),
          payment_attempts: currentAttempts + 1,
        })
        .eq('id', internalOrderId)
        .eq('payment_status', 'pending')
        .select('*')
        .single()

      if (updateError || !updatedOrder) {
        console.log(`[Webhook] Order ${internalOrderId} already processed or update failed`)
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      if (notes?.b2b_gst_compliant === 'true') {
        console.log(`[B2B] Order ${internalOrderId} Paid. Base: ₹${notes.base_amount_inr} | GST: ₹${notes.total_gst_inr}`)
      }

      await updateProductStock(internalOrderId, supabase)

      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          addresses (*),
          order_items (
            *,
            products (name)
          )
        `)
        .eq('id', internalOrderId)
        .single()

      if (fullOrder) {
        if (!fullOrder.customer_name && fullOrder.addresses?.name) {
          fullOrder.customer_name = fullOrder.addresses.name
        }
        try {
          await notifyOrderConfirmed(fullOrder)
        } catch (e) {
          console.error('[Webhook] WhatsApp error:', e)
        }
      }
    }

    if (event.event === 'payment.failed') {
      const { notes, error_description, error_reason } = event.payload.payment.entity
      if (notes?.internal_order_id) {
        // ✅ FIX: Get current attempts first
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('payment_attempts')
          .eq('id', notes.internal_order_id)
          .single()

        const currentAttempts = existingOrder?.payment_attempts || 0

        await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed', 
            status: 'pending',
            payment_failed_reason: error_description || error_reason,
            payment_attempts: currentAttempts + 1,
            last_payment_error: error_description || error_reason
          })
          .eq('id', notes.internal_order_id)
          .eq('payment_status', 'pending')
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function updateProductStock(orderId: string, supabase: any) {
  try {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)
    if (!orderItems) return
    
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
          await supabase
            .from('products')
            .update({ stock: Math.max(0, product.stock - item.quantity) })
            .eq('id', item.product_id)
        }
      }
    }
  } catch (e) {
    console.error('[Webhook] Stock update error:', e)
  }
}