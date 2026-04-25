// src/services/order.service.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

export interface CreateOrderInput {
  addressId: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
  }>
  totalAmount: number
  paymentMethod: string
  shippingMethod: 'delivery' | 'pickup'
  shippingCost: number
}

export async function createOrder(orderData: CreateOrderInput) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const orderNumber = generateOrderNumber()

  // 🔒 SECURITY: Verify prices and total against the database
  const productIds = orderData.items.map((item) => item.product_id)
  
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, price, selling_price, bulk_price, bulk_min_quantity, stock')
    .in('id', productIds)

  if (productsError || !products) {
    throw new Error('Failed to validate products from database')
  }

  let calculatedSubtotal = 0

  const validatedItems = orderData.items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)
    if (!product) throw new Error(`Product not found: ${item.product_id}`)
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for product: ${product.id}`)

    // Securely calculate correct price based on bulk pricing or regular selling price
    const basePrice = product.selling_price ?? product.price
    let actualPrice = basePrice
    let isBulkPricing = false

    if (product.bulk_price && product.bulk_min_quantity && item.quantity >= product.bulk_min_quantity) {
      actualPrice = product.bulk_price
      isBulkPricing = true
    }

    calculatedSubtotal += actualPrice * item.quantity

    return {
      product_id: item.product_id,
      quantity: item.quantity,
      price: actualPrice,
      original_price: basePrice,
      is_bulk_pricing: isBulkPricing,
    }
  })

  // Securely calculate shipping cost
  const actualShippingCost = orderData.shippingMethod === 'pickup' 
    ? 0 
    : (calculatedSubtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)

  const actualTotalAmount = calculatedSubtotal + actualShippingCost

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      address_id: orderData.addressId,
      total_amount: actualTotalAmount, // 🔒 Using DB-validated total
      payment_method: orderData.paymentMethod,
      shipping_method: orderData.shippingMethod,
      shipping_cost: actualShippingCost, // 🔒 Using DB-validated shipping
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw new Error(orderError.message || 'Failed to create order')
  }

  const orderItems = validatedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    original_price: item.original_price,
    is_bulk_pricing: item.is_bulk_pricing,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    throw new Error(itemsError.message || 'Failed to create order items')
  }

  const { error: cartError } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  if (cartError) {
    // Non-critical error, continue
  }

  return { order, orderNumber }
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      addresses (*),
      order_items (
        *,
        products (*)
      )
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getSavedAddresses() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data || []
}

export async function saveAddress(addressData: {
  name: string;
  phone: string;
  address_line1?: string | null;
  address_line2?: string | null;
  landmark?: string | null;
  delivery_instructions?: string | null;
  city?: string | null;
  state?: string | null;
  pincode: string;
  country: string;
  delivery_method: string;
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      ...addressData,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving address:', error)
    throw new Error(error.message || 'Failed to save address')
  }

  return data
}