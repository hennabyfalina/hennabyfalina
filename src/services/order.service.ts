// src/services/order.service.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderNumber } from '@/lib/utils'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { moveAllTempToFinal, deleteB2BArtwork } from '@/lib/supabase/b2b-storage'
import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getIdempotencyRecord, storeIdempotencyRecord } from '@/lib/idempotency'
import { verifyReservations, reserveStock } from '@/services/inventory.service'
import { checkBotId } from 'botid/server'

export interface CreateOrderInput {
  items: Array<{
    product_id: string
    quantity: number
    price: number
    printing_type?: string
    artwork_urls?: string[] | null
    artwork_sizes?: number[] | null  
    printing_instructions?: string | null
    is_temp?: boolean  
  }>
  totalAmount: number
  paymentMethod: string
  shippingMethod: 'delivery' | 'pickup'
  shippingCost: number
  sessionId?: string  
  idempotencyKey?: string
  addressData?: {
    shippingMethod: 'delivery' | 'pickup'
    addressId?: string
    pickupContact?: {
      name: string
      phone: string
      pincode: string
    }
  }
}

const MAX_FILES_PER_ITEM = 3
const MAX_SIZE_PER_ITEM = 15 * 1024 * 1024 

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 m'),
})

export async function createOrder(input: CreateOrderInput) {
  // 1. 🛡️ VERCEL BOTID: THE FINAL 10%
  // Run the background integrity check before spending any database compute
  const verification = await checkBotId();
  if (verification.isBot) {
    console.error(`[Security Firewall] Blocked malicious headless checkout attempt.`);
    throw new Error('Access denied. Automated checkout scripts are strictly prohibited.');
  }

  const supabase = await createClient()
  const { idempotencyKey, addressData, ...orderInput } = input
  
  // 🆕 Extract customer info from addressData for logging/prefill
  let customerName = ''
  let customerPhone = ''
  let customerEmail = ''
  
  if (addressData) {
    if (addressData.shippingMethod === 'delivery' && addressData.addressId) {
      const { data: addr } = await supabase.from('addresses').select('name, phone').eq('id', addressData.addressId).single()
      if (addr) {
        customerName = addr.name
        customerPhone = addr.phone
      }
      
    } else if (addressData.pickupContact) {
      customerName = addressData.pickupContact.name
      customerPhone = addressData.pickupContact.phone
    }
  }
  
  const requestId = crypto.randomUUID()
  console.log(`[OrderService ${requestId}] Creating order for ${customerName}, amount: ₹${orderInput.totalAmount}`)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    customerEmail = user.email || ''

    // 🆕 Validate total amount before proceeding
    if (orderInput.totalAmount <= 0) {
      console.error(`[OrderService ${requestId}] Invalid total amount: ${orderInput.totalAmount}`)
      throw new Error('Invalid order amount. Please refresh and try again.')
    }

    // Idempotency check
    if (idempotencyKey) {
      const existingRecord = await getIdempotencyRecord(idempotencyKey)
      if (existingRecord) {
        console.log(`[OrderService ${requestId}] Returning cached order for key: ${idempotencyKey}`)
        return existingRecord.response
      }
    }

    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    const { success } = await ratelimit.limit(`order_${user.id}_${ip}`)
    if (!success) {
      throw new Error('Too many order attempts. Please wait a minute.')
    }

    const { items, totalAmount, paymentMethod, shippingMethod, shippingCost, sessionId } = orderInput

    if (!items || items.length === 0) throw new Error('Cart is empty')

    // Validate products and calculate subtotal
    const productIds = items.map(i => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, selling_price, stock, name, pricing_tiers:product_pricing_tiers(*)')
      .in('id', productIds)

    if (productsError || !products) throw new Error('Failed to validate products')

    // 🔒 ZERO-TRUST ENGINE: Calculate everything on the server
    let calculatedSubtotal = 0
    const secureOrderItems = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new Error(`Product not found: ${item.product_id}`)
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`)

      const selectedTier = product.pricing_tiers?.find((t: any) => t.tier_name === item.printing_type)
      const expectedPrice = selectedTier?.selling_price ?? (product.selling_price ?? product.price)

      // 🛑 IGNORING CLIENT PRICE: We strictly use expectedPrice fetched from Supabase
      calculatedSubtotal += expectedPrice * item.quantity

      // Store the secure data for our database insertion later
      secureOrderItems.push({
        ...item,
        secure_price: expectedPrice,
        secure_original_price: selectedTier?.mrp ?? product.price
      })
    }

    // Verify stock reservations
    if (sessionId) {
      // Group items by product_id to correctly sum quantities for items with different printing types
      const groupedItems = Object.values(items.reduce((acc, item) => {
        if (!acc[item.product_id]) {
          acc[item.product_id] = { product_id: item.product_id, quantity: 0 }
        }
        acc[item.product_id].quantity += item.quantity
        return acc
      }, {} as Record<string, { product_id: string; quantity: number }>))

      let { valid, errors } = await verifyReservations(sessionId, groupedItems)
      
      // If quantity mismatch or missing, try to re-reserve once before failing
      // This handles edge cases where cart quantity changed just before clicking 'Place Order' or reservation expired
      if (!valid) {
        console.warn(`[OrderService ${requestId}] Reservation invalid, attempting re-reservation: ${errors?.join(', ')}`)
        const reReserve = await reserveStock(sessionId, groupedItems, user.id)
        if (reReserve.success) {
          const reVerify = await verifyReservations(sessionId, groupedItems)
          valid = reVerify.valid
          errors = reVerify.errors
        }
      }

      if (!valid) {
        throw new Error(`Stock reservation expired or invalid: ${errors?.join(', ')}`)
      }
    }

    // 🔒 ZERO-TRUST TOTALS: Calculate final shipping and totals natively
    const expectedShipping = shippingMethod === 'pickup' ? 0 : (calculatedSubtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
    const expectedTotal = calculatedSubtotal + expectedShipping

    const orderNumber = generateOrderNumber()

    // Process artwork files
    const supabaseAdmin = createAdminClient()
    const finalArtworkUrls: Record<string, string[]> = {}

    for (const item of items) {
      if (item.artwork_urls && item.artwork_urls.length > 0 && item.is_temp) {
        try {
          const finalPaths = await moveAllTempToFinal(item.artwork_urls, user.id, supabaseAdmin)
          finalArtworkUrls[item.product_id] = finalPaths
        } catch (error: any) {
          console.error(`Error moving files for product ${item.product_id}:`, error)
          if (error.message?.includes('already exists')) {
            finalArtworkUrls[item.product_id] = item.artwork_urls.map((url: string) => 
              url.replace('/temp/', `/${user.id}/`)
            )
          } else {
            throw new Error('Failed to process artwork files. Please try again.')
          }
        }
      } else {
        finalArtworkUrls[item.product_id] = item.artwork_urls || []
      }
    }

    // Handle address/pickup data (NOT saved to addresses table yet for new addresses)
    let finalAddressId: string | null = null
    let pickupContactData: any = null

    if (shippingMethod === 'delivery') {
      if (addressData?.addressId) {
        finalAddressId = addressData.addressId
        console.log(`[OrderService ${requestId}] Using delivery address ID: ${finalAddressId}`)
      } else {
        throw new Error('A valid delivery address is required.')
      }
    } else {
      // Pickup: store contact info in pickup_contact column
      if (addressData?.pickupContact) {
        pickupContactData = addressData.pickupContact
        console.log(`[OrderService ${requestId}] Pickup contact: ${pickupContactData.name}`)
      }
    }

    // Create order
    const orderInsertData: any = {
      order_number: orderNumber,
      user_id: user.id,
      total_amount: expectedTotal,
      shipping_cost: expectedShipping,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: 'pending',
      idempotency_key: idempotencyKey || null,
      session_id: sessionId,
      shipping_method: shippingMethod,
    }

    // Add address_id only if it exists (existing address)
    if (finalAddressId) {
      orderInsertData.address_id = finalAddressId
    }

    // Add pickup_contact for pickup orders
    if (shippingMethod === 'pickup' && pickupContactData) {
      orderInsertData.pickup_contact = pickupContactData
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single()

    if (orderError) {
      console.error(`[OrderService ${requestId}] Order insert error:`, orderError)
      throw new Error(orderError.message)
    }

    console.log(`[OrderService ${requestId}] Order created successfully: ${order.id} (${orderNumber})`)

    // Create order items
    const orderItems = secureOrderItems.map(item => {
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.secure_price,
        original_price: item.secure_original_price,
        printing_type: item.printing_type || 'Retail (Readymade)',
        artwork_urls: finalArtworkUrls[item.product_id] || [],
        printing_instructions: item.printing_instructions || null,
      }
    })

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error(`[OrderService ${requestId}] Order items insert error:`, itemsError)
      throw new Error(itemsError.message)
    }

    await supabase.from('cart_items').delete().eq('user_id', user.id)

    // Store idempotency record
    if (idempotencyKey) {
      await storeIdempotencyRecord(idempotencyKey, order, 200)
    }

    return order

  } catch (error: any) {
    console.error(`[OrderService ${requestId}] Order creation error:`, error)
    throw new Error(error.message || 'Failed to create order')
  }
}

export async function getUserOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, image:images)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getOrderDetails(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, image:images)
      ),
      address:addresses (*)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function saveAddress(addressData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbAddressData = {
    name: addressData.name || addressData.fullName,
    phone: addressData.phone,
    address_line1: addressData.addressLine1 || null,
    address_line2: addressData.addressLine2 || null,
    city: addressData.city || null,
    state: addressData.state || null,
    pincode: addressData.pincode,
    landmark: addressData.landmark || null,
    delivery_instructions: addressData.delivery_instructions || null,
    is_default: addressData.is_default ?? false,
    delivery_method: addressData.delivery_method || 'delivery',
    is_temp: addressData.is_temp ?? false,
  }

  if (!dbAddressData.is_temp && dbAddressData.delivery_method === 'delivery') {
    const { count, error: countError } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('delivery_method', 'delivery')
      .eq('is_temp', false)

    if (countError) throw countError

    if (count && count >= 2) {
      throw new Error('You can only save up to 2 delivery addresses.')
    }
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      ...dbAddressData,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message || 'Failed to save address')
  return data
}

export async function getProductIdsForOrder(orderId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('order_items')
    .select('product_id')
    .eq('order_id', orderId)

  if (error) return []
  return data.map(item => item.product_id)
}

export async function updateAddress(addressId: string, addressData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbAddressData = {
    name: addressData.name || addressData.fullName,
    phone: addressData.phone,
    address_line1: addressData.addressLine1 || null,
    address_line2: addressData.addressLine2 || null,
    city: addressData.city || null,
    state: addressData.state || null,
    pincode: addressData.pincode,
    landmark: addressData.landmark || null,
    delivery_instructions: addressData.delivery_instructions || null,
    delivery_method: addressData.delivery_method || 'delivery',
  }

  const { data, error } = await supabase
    .from('addresses')
    .update(dbAddressData)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message || 'Failed to update address')
  return data
}

export async function getSavedAddresses(method?: 'delivery' | 'pickup') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (method) {
    query = query.eq('delivery_method', method)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// Helper function to finalize address after payment success
export async function finalizeOrderAddress(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get order with address_id
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, shipping_method, address_id')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) throw new Error('Order not found')

  // Only process delivery orders with a linked address
  if (order.shipping_method === 'delivery' && order.address_id) {
    // 1. Update the linked address to be permanent and default
    await supabase
      .from('addresses')
      .update({ is_temp: false, is_default: true, updated_at: new Date().toISOString() })
      .eq('id', order.address_id)

    // 2. Clear default flag from other addresses
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', order.address_id)
      .eq('delivery_method', 'delivery')

    // 3. Enforce the 2-Address LRU Limit
    const { data: permanentAddresses } = await supabase
      .from('addresses')
      .select('id, is_default, updated_at')
      .eq('user_id', user.id)
      .eq('delivery_method', 'delivery')
      .eq('is_temp', false)
      .order('updated_at', { ascending: true })

    if (permanentAddresses && permanentAddresses.length > 2) {
      // Identify the oldest non-default address to delete
      const nonDefaultAddresses = permanentAddresses.filter(a => !a.is_default)
      const addressToDelete = nonDefaultAddresses.length > 0 
        ? nonDefaultAddresses[0] 
        : permanentAddresses[0]

      await supabase
        .from('addresses')
        .delete()
        .eq('id', addressToDelete.id)
    }
    
    console.log(`[OrderService] Finalized address for order ${orderId}: ${order.address_id}`)
  }

  return { success: true }
}