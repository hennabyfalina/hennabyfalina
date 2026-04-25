// src/app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error(`[WEBHOOK] Invalid signature from IP: ${clientIp}`)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
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

    // Handle payment captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const { notes, method, id: razorpayPaymentId, order_id: razorpayOrderId, amount, currency } = payment
      const internalOrderId = notes?.internal_order_id

      console.log(`[WEBHOOK] Payment captured: order=${internalOrderId}, method=${method}, amount=${amount / 100} ${currency}`)

      if (!internalOrderId) {
        console.error('[WEBHOOK] No internal order ID in payment notes')
        return NextResponse.json(
          { error: 'Missing order reference' },
          { status: 400 }
        )
      }

      // 🔒 SECURITY: Atomic Update (Optimistic Concurrency Control)
      // Prevents double-stock-deduction if 2 webhooks arrive at the exact same millisecond.
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
        .neq('payment_status', 'paid') // 🔒 Only update if NOT already paid
        .select()
        .single()

      if (updateError || !updatedOrder) {
        console.log(`[WEBHOOK] Order ${internalOrderId} already marked as paid or not found, skipping`)
        return NextResponse.json({ received: true, alreadyProcessed: true })
      }

      console.log(`[WEBHOOK] Order ${internalOrderId} updated successfully`)

      // Update product stock
      const stockUpdateResult = await updateProductStock(internalOrderId, supabase)
      console.log(`[WEBHOOK] Stock update result: ${stockUpdateResult}`)

      const duration = Date.now() - startTime
      console.log(`[WEBHOOK] Payment captured for order ${internalOrderId}: ${method} (took ${duration}ms)`)
    }

    // Handle payment failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const { notes, error_description, error_reason, amount, currency } = payment
      const internalOrderId = notes?.internal_order_id

      console.log(`[WEBHOOK] Payment failed: order=${internalOrderId}, reason=${error_reason}, amount=${amount / 100} ${currency}`)

      if (internalOrderId) {
        // Check if order already has a failed record
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', internalOrderId)
          .single()

        if (existingOrder?.payment_status === 'failed') {
          console.log(`[WEBHOOK] Order ${internalOrderId} already marked as failed, skipping`)
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
        } else {
          console.log(`[WEBHOOK] Payment failed for order ${internalOrderId}: ${error_reason}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to update product stock after successful payment
async function updateProductStock(orderId: string, supabase: any): Promise<string> {
  try {
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error(`[WEBHOOK] Error fetching order items for ${orderId}:`, itemsError)
      return 'failed - items fetch error'
    }

    if (!orderItems || orderItems.length === 0) {
      console.warn(`[WEBHOOK] No items found for order ${orderId}`)
      return 'no items'
    }

    let successCount = 0
    let failCount = 0

    // Update stock for each product
    for (const item of orderItems) {
      // 🔒 SECURITY: Try Atomic RPC to prevent race conditions during high traffic
      const { error: rpcError } = await supabase.rpc('decrement_product_stock', {
        p_id: item.product_id,
        decrement_qty: item.quantity
      })

      if (rpcError) {
        // Fallback if RPC doesn't exist in Supabase yet
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
        console.log(`[WEBHOOK] Safely decremented stock for product ${item.product_id} via RPC`)
        successCount++
      }
    }

    return `updated: ${successCount} succeeded, ${failCount} failed`
  } catch (error) {
    console.error('[WEBHOOK] Error updating product stock:', error)
    return 'failed - exception'
  }
}