// src/app/api/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { calculateTaxBreakdown } from '@/lib/tax'
import { generateIdempotencyKey } from '@/lib/idempotency'

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
    })
  : null

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, orderNumber, userId } = await request.json()

    if (!orderId || !orderNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (ratelimit) {
      const { success, reset } = await ratelimit.limit(`razorpay_init_${userId}`)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests', waitTime: Math.ceil((reset - Date.now()) / 1000) },
          { status: 429 }
        )
      }
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized transaction attempt' },
        { status: 401 }
      )
    }

    // ✅ FIX: Include razorpay_order_id in select
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_amount, idempotency_key, razorpay_order_id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order already paid', paid: true },
        { status: 400 }
      )
    }

    // ✅ FIX: Check for existing Razorpay order ID
    if (order.razorpay_order_id) {
      return NextResponse.json({
        orderId: order.razorpay_order_id,
        amount: Math.round(order.total_amount * 100),
        currency: 'INR',
        existing: true
      })
    }

    let razorpay
    try {
      razorpay = getRazorpayInstance()
    } catch (configError: any) {
      console.error('Razorpay config error:', configError.message)
      return NextResponse.json(
        { error: 'Payment service temporarily unavailable' },
        { status: 500 }
      )
    }

    const taxBreakdown = calculateTaxBreakdown(order.total_amount)
    const idempotencyKey = generateIdempotencyKey()

    await supabase
      .from('orders')
      .update({ idempotency_key: idempotencyKey })
      .eq('id', orderId)

    const options = {
      amount: Math.round(order.total_amount * 100),
      currency: 'INR',
      receipt: orderNumber.substring(0, 40),
      notes: {
        internal_order_id: orderId,
        user_id: userId,
        idempotency_key: idempotencyKey,
        b2b_gst_compliant: 'true',
        base_amount_inr: taxBreakdown.basePrice.toString(),
        total_gst_inr: taxBreakdown.totalGST.toString(),
        cgst_9_percent: taxBreakdown.cgst.toString(),
        sgst_9_percent: taxBreakdown.sgst.toString()
      },
    }

    const razorpayOrder = await razorpay.orders.create(options)

    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderId)

    console.log(`[SECURE] Razorpay order ${razorpayOrder.id} for DB order ${orderId}`)

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    })
    
  } catch (error: any) {
    console.error('Razorpay generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}