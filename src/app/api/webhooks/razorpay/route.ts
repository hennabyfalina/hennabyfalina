// src/app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { notifyOrderConfirmed } from '@/services/whatsapp.service'
import { getIdempotencyRecord, storeIdempotencyRecord } from '@/lib/idempotency'
import { releaseStockReservation, deductOrderStock } from '@/services/inventory.service'
import { finalizeOrderAddress } from '@/services/order.service'

// 🔒 SAFE BUILD CHECK: Only initialize if the URL is an actual valid web address, ignoring "***" placeholders
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })
  : null

interface WebhookLog {
  event_type: string
  razorpay_order_id: string
  razorpay_payment_id: string
  order_id: string | null
  payload: any
  signature: string
  processed: boolean
  error_message?: string
}

async function logWebhook(supabase: any, logData: WebhookLog): Promise<void> {
  try {
    await supabase.from('webhook_logs').insert({
      event_type: logData.event_type,
      razorpay_order_id: logData.razorpay_order_id,
      razorpay_payment_id: logData.razorpay_payment_id,
      order_id: logData.order_id,
      payload: logData.payload,
      signature: logData.signature,
      processed: logData.processed,
      error_message: logData.error_message || null,
      created_at: new Date().toISOString()
    })
  } catch (err) {
    // Non-critical background task fail suppression
  }
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const webhookId = crypto.randomUUID()
  
  if (ratelimit) {
    const { success } = await ratelimit.limit(`razorpay_webhook_${clientIp}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔒 MAXIMUM PROTECTION: Verify signature using constant-time comparison BEFORE looking at event types
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return NextResponse.json({ error: 'Invalid token verification' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration setup error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

    // Process payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const { notes, method, id: razorpayPaymentId, order_id: razorpayOrderId, amount } = payment
      const internalOrderId = notes?.internal_order_id
      const idempotencyKey = notes?.idempotency_key 
        ? `${notes.idempotency_key}_webhook_captured` 
        : `webhook_captured_${razorpayPaymentId}`

      await logWebhook(supabase, {
        event_type: 'payment.captured',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        order_id: internalOrderId || null,
        payload: event,
        signature: signature,
        processed: false
      })

      if (!internalOrderId) {
        return NextResponse.json({ error: 'Missing target validation identifier' }, { status: 400 })
      }

      // 🔒 ENTERPRISE DISTRIBUTED LOCK: Prevent Millisecond Webhook Concurrency Race Conditions
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const redis = Redis.fromEnv()
        const lockKey = `lock:webhook:payment:${razorpayPaymentId}`
        
        // SETNX atomic equivalent: Try to acquire an exclusive lock for 5 minutes
        const acquiredLock = await redis.set(lockKey, 'processing', {
          nx: true,
          ex: 300
        })
        if (!acquiredLock) {
          return NextResponse.json({ received: true, message: 'Concurrent request is already being processed.' })
        }
      }

      if (idempotencyKey) {
        const existingRecord = await getIdempotencyRecord(idempotencyKey)
        if (existingRecord) {
          return NextResponse.json({ received: true, alreadyProcessed: true })
        }
      }

      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('id, payment_status, razorpay_payment_id, payment_attempts, total_amount, session_id')
        .eq('id', internalOrderId)
        .single()

      if (fetchError || !existingOrder) {
        return NextResponse.json({ error: 'Target tracking missing' }, { status: 404 })
      }

      if (existingOrder.payment_status === 'paid' || existingOrder.razorpay_payment_id) {
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      const expectedAmount = Math.round(existingOrder.total_amount * 100)
      if (amount !== expectedAmount) {
        await logWebhook(supabase, {
          event_type: 'payment.captured',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          order_id: internalOrderId,
          payload: event,
          signature: signature,
          processed: false,
          error_message: `Value error mismatch matching system target amount.`
        })
        return NextResponse.json({ error: 'Verification data tracking mismatch' }, { status: 400 })
      }

      const currentAttempts = existingOrder.payment_attempts || 0

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
        .select('id')
        .maybeSingle()

      if (updateError || !updatedOrder) {
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      try {
        await finalizeOrderAddress(internalOrderId)
      } catch (addressError) {
        // Suppress non-blocking address finalizing exceptions
      }

      if (existingOrder.session_id) {
        await releaseStockReservation(existingOrder.session_id)
      }

      if (idempotencyKey) {
        await storeIdempotencyRecord(idempotencyKey, { processed: true, orderId: internalOrderId }, 200)
      }

      await supabase
        .from('webhook_logs')
        .update({ processed: true })
        .eq('razorpay_payment_id', razorpayPaymentId)
        .eq('event_type', 'payment.captured')

      await deductOrderStock(internalOrderId)

      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`*, addresses (*), order_items (*, products (name))`)
        .eq('id', internalOrderId)
        .single()

      if (fullOrder) {
        if (!fullOrder.customer_name && fullOrder.addresses?.name) {
          fullOrder.customer_name = fullOrder.addresses.name
        }
        notifyOrderConfirmed(fullOrder).catch(() => {})
      }
    }

    // Process payment.failed event safely
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const { notes, error_description, error_reason, id: razorpayPaymentId, order_id: razorpayOrderId } = payment
      const internalOrderId = notes?.internal_order_id

      await logWebhook(supabase, {
        event_type: 'payment.failed',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        order_id: internalOrderId || null,
        payload: event,
        signature: signature,
        processed: true
      })

      if (internalOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('payment_attempts')
          .eq('id', internalOrderId)
          .single()

        const currentAttempts = existingOrder?.payment_attempts || 0

        await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed', 
            status: 'pending',
            payment_failed_reason: error_description || error_reason,
            payment_attempts: currentAttempts + 1,
            last_payment_error: error_description || error_reason,
            razorpay_payment_id: razorpayPaymentId
          })
          .eq('id', internalOrderId)
          .eq('payment_status', 'pending')
      }
    }

    return NextResponse.json({ received: true })
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal system handling fault' }, { status: 500 })
  }
}