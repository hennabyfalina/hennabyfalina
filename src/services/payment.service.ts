// src/services/payment.service.ts

import { createClient } from '@/lib/supabase/server'

export async function updatePaymentStatus(
  orderId: string,
  paymentId: string,
  status: 'paid' | 'failed'
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: status === 'paid' ? 'paid' : 'failed',
      status: status === 'paid' ? 'confirmed' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating payment status:', error)
    throw new Error('Failed to update order status')
  }

  // If payment is successful, update product stock
  if (status === 'paid') {
    await updateProductStock(orderId)
  }
}

async function updateProductStock(orderId: string) {
  const supabase = await createClient()
  
  // Get order items
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    console.error('Error fetching order items:', itemsError)
    return
  }

  // 🚨 Unified and Hardened Stock Update Logic
  for (const item of orderItems) {
    const { error: rpcError } = await supabase.rpc('decrement_product_stock', {
      p_id: item.product_id,
      decrement_qty: item.quantity,
    })

    // Smart Fallback just like the Webhook
    if (rpcError) {
      console.warn(`[Payment Service] RPC failed for ${item.product_id}. Using fallback query.`)
      const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
      
      if (product) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity) })
          .eq('id', item.product_id)
      }
    }
  }
}