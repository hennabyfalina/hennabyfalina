// src/services/order.service.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderNumber } from '@/lib/utils'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getIdempotencyRecord, storeIdempotencyRecord } from '@/lib/idempotency'
import { verifyReservations, reserveStock } from '@/services/inventory.service'

export interface CreateOrderInput {
  items: Array<{
    product_id: string
    quantity: number
    price: number
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

export interface AddressPayload {
  id?: string
  name: string
  phone: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode: string
  landmark?: string
  delivery_instructions?: string
  is_default?: boolean
  delivery_method?: 'delivery' | 'pickup'
  is_temp?: boolean
}

// Upstash rate limiting engine configuration
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 m'),
})

/**
 * 🚀 SECURE: Zero-Trust Order Creation Pipeline
 * Orchestrates checkout processing using admin credentials to prevent RLS blockage
 */
export async function createOrder(input: CreateOrderInput) {
  const requestHeaders = await headers();
  const supabaseAdmin = createAdminClient()

  // 🔒 VERCEL NATIVE FIREWALL SHIELD
  const botScoreHeader = requestHeaders.get('x-vercel-bot-score');
  if (botScoreHeader !== null && parseInt(botScoreHeader, 10) < 20) {
    const botScore = parseInt(botScoreHeader, 10);
    console.error(`[Security Firewall] Blocked automated checkout attempt. Score: ${botScore}`);
    throw new Error('Access denied. Automated checkout scripts are strictly prohibited.');
  }

  const supabase = await createClient()
  const { idempotencyKey, addressData, ...orderInput } = input
  
  let customerName = ''
  let customerPhone = ''
  let customerEmail = ''
  
  if (addressData) {
    if (addressData.shippingMethod === 'delivery' && addressData.addressId) {
      // Fetch address via admin client to cleanly read temporary checkout records
      const { data: addr } = await supabaseAdmin
        .from('addresses')
        .select('name, phone')
        .eq('id', addressData.addressId)
        .limit(1)
        .maybeSingle()
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
  console.log(`[OrderService ${requestId}] Creating order for ${customerName}, total: ₹${orderInput.totalAmount}`)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized profile access verification context.')
    
    customerEmail = user.email || ''

    if (orderInput.totalAmount <= 0) {
      console.error(`[OrderService ${requestId}] Invalid total amount context: ${orderInput.totalAmount}`)
      throw new Error('Invalid order amount parameters. Please try again.')
    }

    if (idempotencyKey) {
      const existingRecord = await getIdempotencyRecord(idempotencyKey)
      if (existingRecord) {
        console.log(`[OrderService ${requestId}] Returning cached transactional context for: ${idempotencyKey}`)
        return existingRecord.response
      }
    }

    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    const { success } = await ratelimit.limit(`order_${user.id}_${ip}`)
    if (!success) {
      throw new Error('Too many sequential transaction attempts. Please wait a minute before re-trying.')
    }

    const { items, totalAmount, paymentMethod, shippingMethod, shippingCost, sessionId } = orderInput
    if (!items || items.length === 0) throw new Error('The active checkout item matrix is empty.')

    const productIds = items.map(i => i.product_id)
    
    // Fetch product specs securely via administrative layer parameters
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, retail_price, wholesale_price, wholesale_min_qty, mrp, stock, is_deleted, is_active')
      .in('id', productIds)

    if (productsError || !products) throw new Error('Failed to compute secure product validation checks.')

    let calculatedSubtotal = 0
    const secureOrderItems = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new Error(`Product tracking item missing inside master catalog tables: ${item.product_id}`)
      if (product.stock < item.quantity) throw new Error(`Insufficient inventory allocations remaining for: ${product.name}`)

      if (product.is_deleted || !product.is_active) {
        throw new Error(`The item "${product.name}" has been deselected from our catalog. Remove it from your cart to proceed.`)
      }

      // 🎯 DYNAMIC BULK RATE DETERMINATION (Checks B2B Wholesale Pricing Tiers)
      // If client buys equal or more than the wholesale minimum qty, apply volume price tokens!
      const productPrice = product.retail_price ?? 0
      const appliedUnitPrice = (product.wholesale_price && product.wholesale_price > 0 && item.quantity >= product.wholesale_min_qty) 
        ? product.wholesale_price 
        : productPrice;

      // 🔒 ITEM PRICE MISMATCH SHIELD
      if (Math.abs(appliedUnitPrice - item.price) > 0.01) {
        console.error(`[OrderService ${requestId}] Dynamic catalog drift detected for ${product.name}. Client: ₹${item.price}, Server: ₹${appliedUnitPrice}`)
        throw new Error(`The catalog configuration matrices for ${product.name} changed. Please refresh your checkout session.`)
      }

      calculatedSubtotal += appliedUnitPrice * item.quantity

      secureOrderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        secure_price: appliedUnitPrice,
        secure_original_price: product.mrp || productPrice
      })
    }

    // Secure stock inventory reservation checks
    if (sessionId) {
      const groupedItems = Object.values(items.reduce((acc, item) => {
        if (!acc[item.product_id]) {
          acc[item.product_id] = { product_id: item.product_id, quantity: 0 }
        }
        acc[item.product_id].quantity += item.quantity
        return acc
      }, {} as Record<string, { product_id: string; quantity: number }>))

      let { valid, errors } = await verifyReservations(sessionId, groupedItems)
      
      if (!valid) {
        console.warn(`[OrderService ${requestId}] Stale structural reservation context. Attempting recovery: ${errors?.join(', ')}`)
        const reReserve = await reserveStock(sessionId, groupedItems, user.id)
        if (reReserve.success) {
          const reVerify = await verifyReservations(sessionId, groupedItems)
          valid = reVerify.valid
          errors = reVerify.errors
        }
      }

      if (!valid) {
        throw new Error(`The stock allocation holding window expired: ${errors?.join(', ')}`)
      }
    }

    // 🔒 ZERO-TRUST SHIPPING CHARGES VERIFICATION
    const expectedShipping = shippingMethod === 'pickup' ? 0 : (calculatedSubtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
    if (Math.abs(expectedShipping - shippingCost) > 0.01) {
      console.error(`[OrderService ${requestId}] Shipping parameters mismatch. Client: ₹${shippingCost}, Server: ₹${expectedShipping}`)
      throw new Error('Logistics terminal freight rates updated. Please recalculate totals.')
    }

    const expectedTotal = calculatedSubtotal + expectedShipping
    if (Math.abs(expectedTotal - totalAmount) > 0.01) {
      console.error(`[OrderService ${requestId}] Absolute total verification breach. Client: ₹${totalAmount}, Server: ₹${expectedTotal}`)
      throw new Error('Catalog prices have been updated. Refresh your cart page to sync parameters.')
    }

    const orderNumber = generateOrderNumber()
    let finalAddressId: string | null = null
    let pickupContactData: any = null

    if (shippingMethod === 'delivery') {
      if (addressData?.addressId) {
        finalAddressId = addressData.addressId
      } else {
        throw new Error('A secure verified address allocation token is required for freight runs.')
      }
    } else {
      if (addressData?.pickupContact) {
        pickupContactData = addressData.pickupContact
      }
    }

    // Construct transactional payload records mapping to the strict relational schema
    const orderInsertPayload: any = {
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

    if (finalAddressId) {
      orderInsertPayload.address_id = finalAddressId
    }

    if (shippingMethod === 'pickup' && pickupContactData) {
      orderInsertPayload.pickup_contact = pickupContactData
    }

    // Execute insertion using admin privileges to bypass RLS restrictions completely
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderInsertPayload)
      .select()
      .limit(1)
      .maybeSingle()

    if (orderError || !order) {
      console.error(`[OrderService ${requestId}] Core order master allocation trace drop:`, orderError)
      throw new Error(orderError?.message || 'Failed to initialize system transaction rows.')
    }

    const orderItemsPayload = secureOrderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.secure_price,
      original_price: item.secure_original_price
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsPayload)

    if (itemsError) {
      console.error(`[OrderService ${requestId}] Relational lines binding error:`, itemsError)
      // Rollback master order shell on failure to prevent stale orphaned parameters
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw new Error('Relational item configurations matching this transaction failed to compile securely.')
    }

    // Purge cart rows clean upon successful processing
    await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id)

    if (idempotencyKey) {
      await storeIdempotencyRecord(idempotencyKey, order, 200)
    }

    return order

  } catch (error: any) {
    console.error(`[OrderService ${requestId}] Transaction lifecycle crash:`, error)
    throw new Error(error.message || 'The checkout orchestration layer rejected the transaction.')
  }
}

export async function getUserOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized profile lookups prohibited.')

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
  if (!user) throw new Error('Unauthorized profile lookups prohibited.')

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
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/**
 * 🚀 SECURE: Draft Address Persistence Engine
 * Saves data via admin client to bypass user RLS blockages safely mid-checkout
 */
export async function saveAddress(addressData: AddressPayload) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized access validation threshold.')

  const dbAddressData = {
    name: addressData.name,
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

  // Enforce address bounds ceiling ONLY on permanent choices (B2B address limit rule)
  if (!dbAddressData.is_temp && dbAddressData.delivery_method === 'delivery') {
    const { count, error: countError } = await supabaseAdmin
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('delivery_method', 'delivery')
      .eq('is_temp', false)

    if (countError) throw countError

    if (count && count >= 2) {
      throw new Error('B2B Profile Limits Exceeded: You can save up to 2 permanent delivery addresses in your dashboard.')
    }
  }

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .insert({
      ...dbAddressData,
      user_id: user.id,
    })
    .select()
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to safely commit data attributes across connection boundaries.')
  return data
}

export async function getProductIdsForOrder(orderId: string): Promise<string[]> {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', orderId)

  if (error) return []
  return data.map(item => item.product_id)
}

export async function updateAddress(addressId: string, addressData: AddressPayload) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized.')

  const dbAddressData = {
    name: addressData.name,
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

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .update(dbAddressData)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to modify address line configuration matrices.')
  return data
}

export async function getSavedAddresses(method?: 'delivery' | 'pickup') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized profile lookups prohibited.')

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

/**
 * 🚀 SECURE: Fetches checkout session history, including temporary drafts
 */
export async function getCheckoutSessionAddresses(): Promise<any[]> {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

/**
 * 🚀 SECURE: Finalizes and promotes a temporary draft address upon successful checkout completion
 */
export async function finalizeOrderAddress(orderId: string) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized parameters verification context.')

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, shipping_method, address_id')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (orderError || !order) throw new Error('The target transactional order shell is missing.')

  if (order.shipping_method === 'delivery' && order.address_id) {
    // Elevate address row to a permanent validated choice
    await supabaseAdmin
      .from('addresses')
      .update({ is_temp: false, is_default: true })
      .eq('id', order.address_id)

    // Revoke default status from legacy profile entries
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', order.address_id)
      .eq('delivery_method', 'delivery')

    // Clean out records exceeding profile constraints ceiling parameters safely
    const { data: permanentAddresses } = await supabaseAdmin
      .from('addresses')
      .select('id, is_default, created_at')
      .eq('user_id', user.id)
      .eq('delivery_method', 'delivery')
      .eq('is_temp', false)
      .order('created_at', { ascending: true })

    if (permanentAddresses && permanentAddresses.length > 2) {
      const nonDefaultAddresses = permanentAddresses.filter(a => !a.is_default)
      const addressToDelete = nonDefaultAddresses.length > 0 
        ? nonDefaultAddresses[0] 
        : permanentAddresses[0]

      await supabaseAdmin
        .from('addresses')
        .delete()
        .eq('id', addressToDelete.id)
    }
  }

  return { success: true }
}