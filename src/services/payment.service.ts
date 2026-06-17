// src/services/payment.service.ts

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { releaseStockReservation, deductOrderStock } from '@/services/inventory.service'

export async function updatePaymentStatus(
  orderId: string,
  paymentId: string,
  status: 'paid' | 'failed',
  idempotencyKey?: string,
  sessionId?: string,
  paymentMethodDetail?: string
) {
  const supabase = createAdminClient()
  
  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('payment_status, idempotency_key, payment_attempts')
    .eq('id', orderId)
    .single()

  if (fetchError) {
    console.error('Error fetching order:', fetchError)
    throw new Error('Failed to fetch order')
  }

  if (existingOrder?.payment_status === 'paid') {
    console.log(`[Payment Service] Order ${orderId} already paid. Skipping.`)
    return { alreadyProcessed: true }
  }

  if (idempotencyKey && existingOrder?.idempotency_key !== idempotencyKey) {
    console.warn(`[Payment Service] Idempotency key mismatch for order ${orderId}`)
    throw new Error('Invalid idempotency key')
  }

  const currentAttempts = existingOrder?.payment_attempts || 0

  // ⚡ METRICS LOOKUP DATA PAYLOAD: Leverage our newly added analytics columns safely
  const updateData: any = {
    payment_status: status === 'paid' ? 'paid' : 'failed',
    status: status === 'paid' ? 'confirmed' : 'pending',
    updated_at: new Date().toISOString(),
    payment_attempts: currentAttempts + 1,
  }

  if (status === 'paid') {
    updateData.razorpay_payment_id = paymentId
    updateData.paid_at = new Date().toISOString() // 🌟 NOW WORKS PERFECTLY
    if (paymentMethodDetail) {
      updateData.payment_method_detail = paymentMethodDetail
    }
  } else {
    updateData.last_payment_error = 'Transaction run update failed'
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .in('payment_status', ['pending', 'failed'])
    .select('id')
    .maybeSingle()

  if (error || !updatedOrder) {
    console.warn(`[Payment Service] Order ${orderId} update ignored (already processed or not found).`)
    return { alreadyProcessed: true }
  }

  if (status === 'paid') {
    await deductOrderStock(orderId)
    if (sessionId) {
      await releaseStockReservation(sessionId)
    }
  }

  return { alreadyProcessed: false }
}

export async function recordPaymentFailure(orderId: string, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const adminSupabase = createAdminClient()
    const { data: order } = await adminSupabase
      .from('orders')
      .select('payment_attempts, payment_status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (order && (order.payment_status === 'pending' || order.payment_status === 'failed')) {
      await adminSupabase
        .from('orders')
        .update({
          payment_attempts: (order.payment_attempts || 0) + 1,
          last_payment_error: reason,
          payment_failed_reason: reason,
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
    }
  } catch (e) {
    console.error('[Payment Service] Failed to record payment failure:', e)
  }
}