// src/app/api/razorpay/verify/route.ts

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createAdminClient } from '@/lib/supabase/admin'
import { updatePaymentStatus } from '@/services/payment.service'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required signature parameters' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      throw new Error('Missing RAZORPAY_KEY_SECRET environment variable')
    }

    // 1. Compute HMAC SHA256 Signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    // 2. Safely compare to prevent timing attacks
    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    )

    if (!isAuthentic) {
      console.error('[Razorpay Verify] Invalid signature detected. Possible tampering attempt.')
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // 3. Eagerly update the database before the asynchronous webhook arrives
    const supabase = createAdminClient()
    
    let query = supabase.from('orders').select('id, payment_status, session_id')
    if (internal_order_id) {
      query = query.eq('id', internal_order_id)
    } else {
      query = query.eq('razorpay_order_id', razorpay_order_id)
    }

    const { data: order } = await query.single()

    // Only update if it hasn't been intercepted by the webhook already
    if (order && (order.payment_status === 'pending' || order.payment_status === 'failed')) {
      console.log(`[Razorpay Verify] Eagerly verifying order: ${order.id}`)
      
      let paymentMethodDetail = undefined;
      try {
        const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: secret })
        const payment = await rzp.payments.fetch(razorpay_payment_id)
        if (payment && payment.method) {
          paymentMethodDetail = payment.method
        }
      } catch (e) {
        console.warn('[Razorpay Verify] Failed to fetch payment method details eagerly:', e)
      }

      await supabase.from('orders').update({ razorpay_order_id }).eq('id', order.id)
      await updatePaymentStatus(order.id, razorpay_payment_id, 'paid', undefined, order.session_id, paymentMethodDetail)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Razorpay Verify Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}