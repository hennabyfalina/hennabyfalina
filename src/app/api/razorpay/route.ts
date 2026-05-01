// src/app/api/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { calculateTaxBreakdown } from '@/lib/tax' // 🚨 Enterprise Tax Engine

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
    // 🔒 SECURITY: We do not extract 'amount' from the client payload. 
    // We solely rely on the database to determine the exact price!
    const { orderId, orderNumber, userId } = await request.json()

    if (!orderId || !orderNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Rate limiting by user ID to prevent spam attacks
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

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized transaction attempt' },
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
      console.error('Order not found or access denied:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      )
    }

    let razorpay
    try {
      razorpay = getRazorpayInstance()
    } catch (configError: any) {
      console.error('Razorpay configuration error:', configError.message)
      return NextResponse.json(
        { error: 'Payment service temporarily unavailable. Please contact support.' },
        { status: 500 }
      )
    }

    // 🚨 Calculate the exact B2B Tax split for the Razorpay Dashboard
    const taxBreakdown = calculateTaxBreakdown(order.total_amount)

    // Create the secure Razorpay order
    const options = {
      amount: Math.round(order.total_amount * 100), // Razorpay accepts paise
      currency: 'INR',
      receipt: orderNumber.substring(0, 40), 
      notes: {
        internal_order_id: orderId, // Crucial for Webhook mapping
        user_id: userId,
        // 🚨 The Accountant's Dream Metadata
        b2b_gst_compliant: 'true',
        base_amount_inr: taxBreakdown.basePrice.toString(),
        total_gst_inr: taxBreakdown.totalGST.toString(),
        cgst_9_percent: taxBreakdown.cgst.toString(),
        sgst_9_percent: taxBreakdown.sgst.toString()
      },
    }

    const razorpayOrder = await razorpay.orders.create(options)

    console.log(`[SECURE CHECKOUT] Razorpay Order ${razorpayOrder.id} generated for DB Order ${orderId}`)

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
    
  } catch (error: any) {
    console.error('Razorpay generation failure:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to securely initialize payment' },
      { status: 500 }
    )
  }
}