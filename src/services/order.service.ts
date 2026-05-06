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
import { z } from 'zod'

export interface CreateOrderInput {
  addressId: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
    printing_type?: string
    artwork_urls?: string[] | null
    artwork_sizes?: number[] | null  // 🆕 Size tracking
    printing_instructions?: string | null
    is_temp?: boolean  // 🆕 Flag to indicate if files are in temp folder
  }>
  totalAmount: number
  paymentMethod: string
  shippingMethod: 'delivery' | 'pickup'
  shippingCost: number
  sessionId?: string  // 🆕 For moving temp files
}

// 🆕 Validation constants
const MAX_FILES_PER_ITEM = 3
const MAX_SIZE_PER_ITEM = 15 * 1024 * 1024 // 15MB

const createOrderSchema = z.object({
  addressId: z.string().min(1),
  items: z.array(z.object({
    product_id: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
    printing_type: z.string().optional(),
    artwork_urls: z.array(z.string()).nullable().optional(),
    artwork_sizes: z.array(z.number()).nullable().optional(),
    printing_instructions: z.string().nullable().optional(),
    is_temp: z.boolean().optional(),
  })).min(1, "Order must contain at least one item"),
  totalAmount: z.number().nonnegative(),
  paymentMethod: z.string().min(1),
  shippingMethod: z.enum(['delivery', 'pickup']),
  shippingCost: z.number().nonnegative(),
  sessionId: z.string().optional(),
})

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })
  : null

/**
 * Validate artwork limits for an order item
 */
function validateArtworkLimits(
  artworkUrls: string[] | null | undefined,
  artworkSizes: number[] | null | undefined
): void {
  const fileCount = artworkUrls?.length || 0
  const totalSize = (artworkSizes || []).reduce((sum, size) => sum + size, 0)

  if (fileCount > MAX_FILES_PER_ITEM) {
    throw new Error(`Maximum ${MAX_FILES_PER_ITEM} files allowed per product. Found: ${fileCount}`)
  }

  if (totalSize > MAX_SIZE_PER_ITEM) {
    throw new Error(`Total artwork size cannot exceed 15MB per product. Found: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
  }
}

export async function createOrder(rawOrderData: CreateOrderInput) {
  const parsed = createOrderSchema.safeParse(rawOrderData)
  if (!parsed.success) throw new Error('Invalid order payload')
  const orderData = parsed.data

  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const { success } = ratelimit ? await ratelimit.limit(`create_order_${ip}`) : { success: true }
  if (!success) throw new Error('Too many attempts. Please try again later.')

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

  // 🆕 Process items: validate artwork and move temp files if needed
  const validatedItems = await Promise.all(orderData.items.map(async (item) => {
    const product = products.find((p) => p.id === item.product_id)
    if (!product) throw new Error(`Product not found: ${item.product_id}`)
    
    // 🆕 Validate artwork limits
    validateArtworkLimits(item.artwork_urls, item.artwork_sizes)

    // 🆕 Move temp files to final folder if marked as temp
    let finalArtworkUrls = item.artwork_urls || []
    if (item.is_temp && item.artwork_urls && item.artwork_urls.length > 0) {
      const adminSupabase = createAdminClient()
      finalArtworkUrls = await moveAllTempToFinal(item.artwork_urls, user.id, adminSupabase)
    }

    // Inventory check (warn but allow - manufacturing will handle)
    if (product.stock < item.quantity) {
      console.warn(`[INVENTORY ALERT] Order exceeds physical stock for: ${product.id}. Manufacturing pipeline triggered.`)
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
      artwork_urls: finalArtworkUrls,
      artwork_sizes: item.artwork_sizes || [],
      printing_instructions: item.printing_instructions || null,
    }
  }))

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

  // Insert order items
  const orderItems = validatedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    original_price: item.original_price,
    is_bulk_pricing: item.is_bulk_pricing,
    printing_type: item.printing_type,
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

  // Clear cart
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

// 🆕 Get product IDs for an order (for clearing drafts)
export async function getProductIdsForOrder(orderId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('order_items')
    .select('product_id')
    .eq('order_id', orderId)

  if (error) {
    console.error('Error fetching order items for draft clearing:', error)
    return []
  }

  return data.map(item => item.product_id)
}

// 🆕 Clean up temp files after failed order
export async function cleanupTempFiles(tempPaths: string[]): Promise<void> {
  const adminSupabase = createAdminClient()
  for (const path of tempPaths) {
    try {
      await adminSupabase.storage.from('artworks').remove([path])
    } catch (error) {
      console.warn(`Failed to delete temp file ${path}:`, error)
    }
  }
}