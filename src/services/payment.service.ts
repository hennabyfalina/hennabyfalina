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

  if (itemsError) {
    console.error('Error fetching order items:', itemsError)
    return
  }

  // Update stock for each product
  for (const item of orderItems) {
    const { error: stockError } = await supabase.rpc('decrement_product_stock', {
      product_id: item.product_id,
      quantity: item.quantity,
    })

    if (stockError) {
      console.error('Error updating stock:', stockError)
    }
  }
}