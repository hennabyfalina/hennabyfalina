// src/app/api/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Serverless Rate Limiter (Falls back to bypassed if Redis env vars are missing during local dev)
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    })
  : null

// Helper to get Razorpay instance (lazy initialization)
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: We no longer extract 'amount' from the client. 
    // We solely rely on the database to determine the price!
    const { orderId, orderNumber, userId } = await request.json()

    // Validate required fields
    if (!orderId || !orderNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Rate limiting by user ID
    if (ratelimit) {
      const { success, reset } = await ratelimit.limit(`razorpay_init_${userId}`)
      if (!success) {
        return NextResponse.json(
          { 
            error: 'Too many requests', 
            waitTime: Math.ceil((reset - Date.now()) / 1000) 
          },
          { status: 429 }
        )
      }
    }

    // Verify user is authenticated (UPDATED TO SECURE getUser)
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the order belongs to this user and is pending
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status, payment_status, total_amount')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify order hasn't been paid already
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      )
    }

    // Initialize Razorpay here (lazy)
    let razorpay
    try {
      razorpay = getRazorpayInstance()
    } catch (configError: any) {
      console.error('Razorpay configuration error:', configError.message)
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(order.total_amount * 100), // Securely use DB amount only!
      currency: 'INR',
      receipt: orderNumber.substring(0, 40), // Prevent Razorpay 40-char limit crash
      notes: {
        internal_order_id: orderId, // ← Important for webhook
        user_id: userId,
      },
    }

    const razorpayOrder = await razorpay.orders.create(options)

    console.log(`Razorpay order created: ${razorpayOrder.id} for order ${orderId}`)

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    )
  }
}