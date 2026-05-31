// src/services/payment.service.ts

import { createClient } from '@/lib/supabase/server'
import { releaseStockReservation, deductOrderStock } from '@/services/inventory.service'

export async function updatePaymentStatus(
  orderId: string,
  paymentId: string,
  status: 'paid' | 'failed',
  idempotencyKey?: string,
  sessionId?: string
) {
  const supabase = await createClient()
  
  // Get current order first
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

  const updateData: any = {
    payment_status: status === 'paid' ? 'paid' : 'failed',
    status: status === 'paid' ? 'confirmed' : 'pending',
    updated_at: new Date().toISOString(),
    payment_attempts: currentAttempts + 1,
  }

  if (status === 'paid') {
    updateData.razorpay_payment_id = paymentId
    updateData.paid_at = new Date().toISOString()
  } else {
    updateData.last_payment_error = 'Manual update'
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('payment_status', 'pending')

  if (error) {
    console.error('Error updating payment status:', error)
    throw new Error('Failed to update order status')
  }

  if (status === 'paid') {
    // 🆕 Use unified stock deduction
    await deductOrderStock(orderId)
    
    if (sessionId) {
      await releaseStockReservation(sessionId)
    }
  }

  return { alreadyProcessed: false }
}