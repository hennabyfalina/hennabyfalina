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
  const requestHeaders = await headers();

  // 🔒 VERCEL NATIVE FIREWALL SHIELD
  // Vercel auto-injects 'x-vercel-bot-score' (0 = absolute bot, 100 = absolute human)
  const botScoreHeader = requestHeaders.get('x-vercel-bot-score');

  if (botScoreHeader !== null && parseInt(botScoreHeader, 10) < 20) {
    const botScore = parseInt(botScoreHeader, 10);
    console.error(`[Security Firewall] Blocked automated checkout attempt. Score: ${botScore}`);
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
      .select('id, price, selling_price, stock, name, is_deleted, is_active, pricing_tiers:product_pricing_tiers(*)')
      .in('id', productIds)

    if (productsError || !products) throw new Error('Failed to validate products')

    // 🔒 ZERO-TRUST ENGINE: Calculate everything on the server
    
    // Initialize Admin Client early for secure file transfers
    const supabaseAdmin = createAdminClient()

    // ⚡ OPTIMIZATION: Process all cart items and their file transfers concurrently
    const secureOrderItems = await Promise.all(items.map(async (item) => {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new Error(`Product not found: ${item.product_id}`)
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`)

      // 🔒 PRODUCT DELETION SHIELD: Ensure the base product hasn't been soft-deleted or deactivated
      if (product.is_deleted || !product.is_active) {
        throw new Error(`The product "${product.name}" is no longer available in our catalog. Please remove it from your cart to proceed.`)
      }

      // 🔒 TIER VALIDATION: Ensure the requested tier hasn't been soft-deleted or deactivated by an admin
      const selectedTier = product.pricing_tiers?.find((t: any) => t.tier_name === item.printing_type && !t.is_deleted && t.is_active)

      if (item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && !selectedTier) {
        throw new Error(`The customization option "${item.printing_type}" for ${product.name} is no longer available. Please remove it from your cart and select a valid option.`)
      }

      const expectedPrice = selectedTier?.selling_price ?? (product.selling_price ?? product.price)

      // 🔒 ITEM PRICE MISMATCH SHIELD: Ensure individual item prices haven't drifted or been manipulated
      if (Math.abs(expectedPrice - item.price) > 0.01) {
        console.error(`[OrderService ${requestId}] Item price mismatch for ${product.name}. Client: ₹${item.price}, Server: ₹${expectedPrice}`)
        throw new Error(`The price for ${product.name} has changed. Please refresh your cart.`)
      }
      
      let processingUrls = item.artwork_urls || []

      // Securely transfer files out of temp storage paths if marked as temporary
      if (processingUrls.length > 0 && item.is_temp) {
        try {
          processingUrls = await moveAllTempToFinal(item.artwork_urls!, user.id, supabaseAdmin)
        } catch (error: any) {
          console.error(`Error moving files for product variation ${item.product_id}:`, error)
          // 🚨 FALLBACK SHIELD: If all else fails, retain original URLs to prevent empty arrays
          processingUrls = item.artwork_urls!
        }
      }

      // Append verified entities cleanly directly onto our final stack
      return {
        ...item,
        secure_price: expectedPrice,
        secure_original_price: selectedTier?.mrp ?? product.price,
        artwork_urls: processingUrls
      }
    }))

    // 🚨 IGNORING CLIENT PRICE: We strictly use expectedPrice fetched from Supabase
    const calculatedSubtotal = secureOrderItems.reduce((sum, item) => sum + (item.secure_price * item.quantity), 0)

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
    
    // 🔒 SHIPPING COST MISMATCH SHIELD: Ensure shipping logic matches
    if (Math.abs(expectedShipping - shippingCost) > 0.01) {
      console.error(`[OrderService ${requestId}] Shipping cost mismatch. Client: ₹${shippingCost}, Server: ₹${expectedShipping}`)
      throw new Error('Delivery rates have been updated. Please review your total.')
    }

    const expectedTotal = calculatedSubtotal + expectedShipping

    // 🔒 PRICE MISMATCH SHIELD: Ensure the user agrees to the exact price the server calculated
    if (Math.abs(expectedTotal - totalAmount) > 0.01) {
      console.error(`[OrderService ${requestId}] Price mismatch. Client: ₹${totalAmount}, Server: ₹${expectedTotal}`)
      throw new Error('Prices have been updated to reflect the latest catalog. Please refresh your cart and try again.')
    }

    const orderNumber = generateOrderNumber()

    // Handle address/pickup data
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
      if (addressData?.pickupContact) {
        pickupContactData = addressData.pickupContact
        console.log(`[OrderService ${requestId}] Pickup contact: ${pickupContactData.name}`)
      }
    }

    // 📅 Calculate 1-Week Default Delivery Date
    const expectedDelivery = new Date()
    expectedDelivery.setDate(expectedDelivery.getDate() + 7)

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
      estimated_delivery_date: expectedDelivery.toISOString(),
    }

    if (finalAddressId) {
      orderInsertData.address_id = finalAddressId
    }

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

    // Create order items directly mapping from our isolated, secured variant models
    const orderItems = secureOrderItems.map(item => {
      // ✅ FORCE CONVERT artwork_urls to string array
      let artworkUrls = item.artwork_urls || []

      // If it's an array of objects (like [{url: "path"}]), extract the url
      if (Array.isArray(artworkUrls) && artworkUrls.length > 0) {
        artworkUrls = artworkUrls.map(url => {
          if (typeof url === 'string') return url
          if (url && typeof url === 'object') return (url as any).url || (url as any).path || String(url)
          return null
        }).filter(Boolean)
      }

      // If it's a JSON string, parse it
      if (typeof artworkUrls === 'string') {
        try {
          const parsed = JSON.parse(artworkUrls)
          if (Array.isArray(parsed)) {
            artworkUrls = parsed.map(u => typeof u === 'string' ? u : u?.url || u?.path).filter(Boolean)
          }
        } catch (e) {}
      }

      // Ensure it's an array of strings
      if (!Array.isArray(artworkUrls)) {
        artworkUrls = []
      }

      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.secure_price,
        original_price: item.secure_original_price,
        printing_type: item.printing_type || 'Retail (Readymade)',
        artwork_urls: artworkUrls, // ✅ Now guaranteed to be string[]
        artwork_sizes: item.artwork_sizes || [],
        printing_instructions: item.printing_instructions || null
      }
    })

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error(`[OrderService ${requestId}] Order items insert error:`, itemsError)
      throw new Error(itemsError.message)
    }

    // Clean up any temp artwork records for this user
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

export async function finalizeOrderAddress(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, shipping_method, address_id')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) throw new Error('Order not found')

  if (order.shipping_method === 'delivery' && order.address_id) {
    await supabase
      .from('addresses')
      .update({ is_temp: false, is_default: true, updated_at: new Date().toISOString() })
      .eq('id', order.address_id)

    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', order.address_id)
      .eq('delivery_method', 'delivery')

    const { data: permanentAddresses } = await supabase
      .from('addresses')
      .select('id, is_default, updated_at')
      .eq('user_id', user.id)
      .eq('delivery_method', 'delivery')
      .eq('is_temp', false)
      .order('updated_at', { ascending: true })

    if (permanentAddresses && permanentAddresses.length > 2) {
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