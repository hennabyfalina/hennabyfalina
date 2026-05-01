// src/services/order.service.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { calculateTaxBreakdown } from '@/lib/tax'

export interface CreateOrderInput {
  addressId: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
    printing_type?: string
    // 🚨 UPGRADED TO ARRAY 🚨
    artwork_urls?: string[] | null
    printing_instructions?: string | null
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

  // SECURITY: Verify prices and total against the database
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
    
    if (product.stock < item.quantity) {
       console.warn(`[INVENTORY ALERT] Order exceeds physical readymade stock for: ${product.id}. Triggering manufacturing pipeline.`)
    }

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
      printing_type: item.printing_type || 'None',
      // 🚨 UPGRADED TO ARRAY 🚨
      artwork_urls: item.artwork_urls || [],
      printing_instructions: item.printing_instructions || null,
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
      total_amount: actualTotalAmount, 
      payment_method: orderData.paymentMethod,
      shipping_method: orderData.shippingMethod,
      shipping_cost: actualShippingCost, 
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw new Error(orderError.message || 'Failed to create order')
  }

  // Inserting items WITH B2B Printing Details
  const orderItems = validatedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    original_price: item.original_price,
    is_bulk_pricing: item.is_bulk_pricing,
    printing_type: item.printing_type,
    // 🚨 UPGRADED TO ARRAY 🚨
    artwork_urls: item.artwork_urls,
    printing_instructions: item.printing_instructions,
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
    console.warn('Could not clear cart after order creation', cartError)
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

// SMART UPSERT: Enforces max 2 addresses and prevents duplicates
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
  if (!user) throw new Error('User not authenticated')

  // Fetch existing addresses to check for duplicates and limits
  const { data: existingAddresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }) 

  if (existingAddresses && existingAddresses.length > 0) {
    const exactMatch = existingAddresses.find(addr => 
      addr.name === addressData.name &&
      addr.phone === addressData.phone &&
      addr.pincode === addressData.pincode &&
      (addr.address_line1 || '') === (addressData.address_line1 || '')
    )

    if (exactMatch) {
      const { data, error } = await supabase
        .from('addresses')
        .update({ ...addressData })
        .eq('id', exactMatch.id)
        .select()
        .single()
      if (error) throw error
      return data
    }

    if (existingAddresses.length >= 2) {
      const oldestId = existingAddresses[0].id
      const { data, error } = await supabase
        .from('addresses')
        .update({ ...addressData })
        .eq('id', oldestId)
        .select()
        .single()
      if (error) throw error
      return data
    }
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