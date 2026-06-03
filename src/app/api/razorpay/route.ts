// src/app/api/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { calculateTaxBreakdown } from '@/lib/tax'
import { 
  generateIdempotencyKey, 
  isValidIdempotencyKey, 
  getIdempotencyRecord, 
  storeIdempotencyRecord 
} from '@/lib/idempotency'
import { checkBotId } from 'botid/server' // 🛡️ Import the server verifier

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
    console.error('[Razorpay API] Missing credentials: KEY_ID:', !!keyId, 'KEY_SECRET:', !!keySecret)
    throw new Error('Razorpay credentials not configured')
  }
  
  console.log('[Razorpay API] Initializing Razorpay with KEY_ID:', keyId.substring(0, 8) + '...')
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`[Razorpay API ${requestId}] Received payment initialization request`)
  
  // 1. 🛡️ VERCEL BOTID: THE FINAL 10%
  const verification = await checkBotId();
  if (verification.isBot) {
    console.error(`[Security Firewall] Blocked malicious headless payment attempt.`);
    return NextResponse.json({ error: 'Access denied. Automated scripts are prohibited.' }, { status: 403 });
  }

  try {
    // Extract idempotency key from headers
    const idempotencyKeyFromHeader = request.headers.get('Idempotency-Key')
    
    const body = await request.json()
    const { orderId, orderNumber, userId, idempotencyKey: bodyIdempotencyKey } = body
    
    console.log(`[Razorpay API ${requestId}] Request body:`, { orderId, orderNumber, userId, hasIdempotencyKey: !!bodyIdempotencyKey })
    
    // Use header key first, then body key as fallback
    const clientIdempotencyKey = idempotencyKeyFromHeader || bodyIdempotencyKey

    if (!orderId || !orderNumber || !userId) {
      console.error(`[Razorpay API ${requestId}] Missing required fields:`, { orderId, orderNumber, userId })
      return NextResponse.json(
        { error: 'Missing required fields', missing: { orderId: !orderId, orderNumber: !orderNumber, userId: !userId } },
        { status: 400 }
      )
    }

    // Validate idempotency key format if provided
    if (clientIdempotencyKey && !isValidIdempotencyKey(clientIdempotencyKey)) {
      console.error(`[Razorpay API ${requestId}] Invalid idempotency key format:`, clientIdempotencyKey)
      return NextResponse.json(
        { error: 'Invalid idempotency key format' },
        { status: 400 }
      )
    }

    // Check for existing idempotency record BEFORE processing
    if (clientIdempotencyKey) {
      const existingRecord = await getIdempotencyRecord(clientIdempotencyKey)
      if (existingRecord) {
        console.log(`[Razorpay API ${requestId}] Returning cached response for key: ${clientIdempotencyKey}`)
        return NextResponse.json(existingRecord.response, { status: existingRecord.statusCode })
      }
    }

    // Rate limiting
    if (ratelimit) {
      const { success, reset } = await ratelimit.limit(`razorpay_init_${userId}`)
      if (!success) {
        console.warn(`[Razorpay API ${requestId}] Rate limited for user ${userId}`)
        return NextResponse.json(
          { error: 'Too many requests', waitTime: Math.ceil((reset - Date.now()) / 1000) },
          { status: 429 }
        )
      }
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      console.error(`[Razorpay API ${requestId}] Unauthorized:`, userError?.message)
      return NextResponse.json(
        { error: 'Unauthorized transaction attempt' },
        { status: 401 }
      )
    }

    // Fetch order with all necessary fields
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_amount, idempotency_key, razorpay_order_id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (orderError || !order) {
      console.error(`[Razorpay API ${requestId}] Order not found:`, orderId, orderError?.message)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log(`[Razorpay API ${requestId}] Order found:`, { 
      id: order.id, 
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      has_razorpay_order_id: !!order.razorpay_order_id 
    })

    // Prevent double payment
    if (order.payment_status === 'paid') {
      console.log(`[Razorpay API ${requestId}] Order already paid`)
      const response = { error: 'Order already paid', paid: true }
      if (clientIdempotencyKey) {
        await storeIdempotencyRecord(clientIdempotencyKey, response, 400)
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Return existing Razorpay order if already created
    if (order.razorpay_order_id) {
      console.log(`[Razorpay API ${requestId}] Returning existing Razorpay order: ${order.razorpay_order_id}`)
      const response = {
        orderId: order.razorpay_order_id,
        amount: Math.round(order.total_amount * 100),
        currency: 'INR',
        existing: true,
        keyId: process.env.RAZORPAY_KEY_ID
      }
      if (clientIdempotencyKey) {
        await storeIdempotencyRecord(clientIdempotencyKey, response, 200)
      }
      return NextResponse.json(response)
    }

    // Initialize Razorpay instance
    let razorpay
    try {
      razorpay = getRazorpayInstance()
    } catch (configError: any) {
      console.error(`[Razorpay API ${requestId}] Razorpay config error:`, configError.message)
      const errorResponse = { error: 'Payment service temporarily unavailable' }
      if (clientIdempotencyKey) {
        await storeIdempotencyRecord(clientIdempotencyKey, errorResponse, 500)
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    const taxBreakdown = calculateTaxBreakdown(order.total_amount)
    
    // Use client-provided idempotency key if available, otherwise generate new one
    const finalIdempotencyKey = clientIdempotencyKey || generateIdempotencyKey('payment')
    
    // Keep the original order creation idempotency key in the DB.
    // We only use finalIdempotencyKey for Razorpay initialization caching.

    // 🆕 Validate amount before creating Razorpay order
    const amountInPaise = Math.round(order.total_amount * 100)
    if (amountInPaise <= 0) {
      console.error(`[Razorpay API ${requestId}] Invalid amount: ${order.total_amount} (${amountInPaise} paise)`)
      return NextResponse.json(
        { error: 'Invalid order amount. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Create Razorpay order with idempotency in notes
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber.substring(0, 40),
      notes: {
        internal_order_id: orderId,
        user_id: userId,
        idempotency_key: finalIdempotencyKey,
        b2b_gst_compliant: 'true',
        base_amount_inr: taxBreakdown.basePrice.toString(),
        total_gst_inr: taxBreakdown.totalGST.toString(),
        cgst_9_percent: taxBreakdown.cgst.toString(),
        sgst_9_percent: taxBreakdown.sgst.toString()
      },
    }

    console.log(`[Razorpay API ${requestId}] Creating Razorpay order with amount: ${amountInPaise} paise (₹${order.total_amount})`)

    let razorpayOrder
    try {
      razorpayOrder = await razorpay.orders.create(options)
    } catch (razorpayError: any) {
      console.error(`[Razorpay API ${requestId}] Razorpay API error:`, razorpayError)
      return NextResponse.json(
        { error: razorpayError.message || 'Razorpay order creation failed' },
        { status: 502 }
      )
    }

    if (!razorpayOrder || !razorpayOrder.id) {
      console.error(`[Razorpay API ${requestId}] Razorpay order creation returned invalid response:`, razorpayOrder)
      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 502 }
      )
    }

    // Update order with Razorpay order ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderId)

    if (updateError) {
      console.error(`[Razorpay API ${requestId}] Failed to update order with Razorpay ID:`, updateError)
      // Don't fail the request – the order is still usable
    }

    console.log(`[Razorpay API ${requestId}] ✅ Successfully created Razorpay order: ${razorpayOrder.id}`)

    const successResponse = {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    }

    // Store successful response for idempotency
    if (clientIdempotencyKey) {
      await storeIdempotencyRecord(clientIdempotencyKey, successResponse, 200)
    }

    return NextResponse.json(successResponse)
    
  } catch (error: any) {
    console.error(`[Razorpay API] Unhandled error:`, error)
    
    // Don't cache 500 errors – allow retry
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}