// src/services/inventory.service.ts

'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface InventoryLog {
  id: string
  product_id: string
  previous_stock: number
  new_stock: number
  change_amount: number
  reason: string
  user_id: string | null
  created_at: string
}

export interface StockReservation {
  id: string
  product_id: string
  quantity: number
  user_id: string
  checkout_session_id: string
  expires_at: Date
  created_at: Date
}

// 🆕 Stock reservation constants
const RESERVATION_EXPIRY_MINUTES = 10
const RESERVATION_CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute

// ============================================
// STOCK RESERVATION SYSTEM (Phase 4)
// ============================================

/**
 * 🆕 Reserve stock for a checkout session
 * Called when user enters checkout page
 */
export async function reserveStock(
  checkoutSessionId: string,
  items: Array<{ product_id: string; quantity: number }>,
  userId: string
): Promise<{ success: boolean; errors?: string[] }> {
  const supabase = createAdminClient()
  const errors: string[] = []

  for (const item of items) {
    // Check if enough stock is available (including existing reservations)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', item.product_id)
      .single()

    if (productError || !product) {
      errors.push(`Product ${item.product_id} not found: ${productError?.message}`)
      continue
    }

    // Calculate total reserved for this product across all active sessions
    const { data: existingReservations, error: reservationError } = await supabase
      .from('stock_reservations')
      .select('quantity')
      .eq('product_id', item.product_id)
      .gt('expires_at', new Date().toISOString())
      .neq('checkout_session_id', checkoutSessionId) // Exclude current session

    if (reservationError) {
      errors.push(`Failed to check reservations for ${product.name}: ${reservationError.message}`)
      continue
    }

    const reservedQuantity = existingReservations?.reduce((sum, r) => sum + r.quantity, 0) || 0
    const availableStock = product.stock - reservedQuantity

    if (availableStock < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}. Only ${availableStock} available.`)
      continue
    }

    // Create or update reservation
    const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000)

    const { error: upsertError } = await supabase
      .from('stock_reservations')
      .upsert({
        product_id: item.product_id,
        quantity: item.quantity,
        user_id: userId,
        checkout_session_id: checkoutSessionId,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'checkout_session_id, product_id',
      })

    if (upsertError) {
      // 🔍 Log the actual error for debugging
      console.error(`[Inventory] Upsert failed for product ${product.name}:`, upsertError)
      errors.push(`Failed to reserve stock for ${product.name}: ${upsertError.message}`)
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * 🆕 Release stock reservation (called on order completion or checkout abandonment)
 */
export async function releaseStockReservation(
  checkoutSessionId: string,
  productId?: string
): Promise<void> {
  const supabase = createAdminClient()

  let query = supabase
    .from('stock_reservations')
    .delete()
    .eq('checkout_session_id', checkoutSessionId)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { error } = await query

  if (error) {
    console.error('[Inventory] Failed to release reservation:', error)
  }
}

/**
 * 🆕 Get current reservations for a checkout session
 */
export async function getReservationsForSession(
  checkoutSessionId: string
): Promise<StockReservation[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('stock_reservations')
    .select('*')
    .eq('checkout_session_id', checkoutSessionId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('[Inventory] Failed to get reservations:', error)
    return []
  }

  return data || []
}

/**
 * 🆕 Verify that all items in an order have valid reservations
 * Called before order creation
 */
export async function verifyReservations(
  checkoutSessionId: string,
  items: Array<{ product_id: string; quantity: number }>
): Promise<{ valid: boolean; errors?: string[] }> {
  const supabase = createAdminClient()
  const errors: string[] = []

  for (const item of items) {
    const { data: reservation, error } = await supabase
      .from('stock_reservations')
      .select('quantity, expires_at')
      .eq('checkout_session_id', checkoutSessionId)
      .eq('product_id', item.product_id)
      .single()

    if (error || !reservation) {
      errors.push(`No reservation found for product ${item.product_id}`)
      continue
    }

    if (new Date(reservation.expires_at) < new Date()) {
      errors.push(`Reservation expired for product ${item.product_id}`)
      continue
    }

    if (reservation.quantity !== item.quantity) {
      errors.push(`Quantity mismatch for product ${item.product_id}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * 🆕 Extend reservation expiry (called when user is still active in checkout)
 */
export async function extendReservationExpiry(
  checkoutSessionId: string,
  additionalMinutes: number = RESERVATION_EXPIRY_MINUTES
): Promise<void> {
  const supabase = createAdminClient()
  const newExpiry = new Date(Date.now() + additionalMinutes * 60 * 1000)

  const { error } = await supabase
    .from('stock_reservations')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('checkout_session_id', checkoutSessionId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('[Inventory] Failed to extend reservations:', error)
  }
}

/**
 * 🆕 Clean up expired reservations (called by cron job)
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('stock_reservations')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('[Inventory] Failed to cleanup expired reservations:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * 🆕 Get available stock for a product (considering active reservations)
 */
export async function getAvailableStock(productId: string): Promise<number> {
  const supabase = createAdminClient()

  // Get current stock
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return 0
  }

  // Get total reserved quantity for this product
  const { data: reservations, error: reservationError } = await supabase
    .from('stock_reservations')
    .select('quantity')
    .eq('product_id', productId)
    .gt('expires_at', new Date().toISOString())

  if (reservationError) {
    console.error('[Inventory] Failed to get reservations:', reservationError)
    return product.stock
  }

  const reservedQuantity = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0
  return Math.max(0, product.stock - reservedQuantity)
}

// ============================================
// UNIFIED STOCK UPDATE SERVICE (NEW)
// ============================================

/**
 * 🚀 Unified stock deduction for orders – called by both webhook and payment service
 * Use this instead of duplicate updateProductStock functions.
 */
export async function deductOrderStock(orderId: string): Promise<void> {
  const supabase = await createServerClient()
  
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    console.error('[Inventory] Failed to fetch order items for stock deduction:', itemsError)
    return
  }

  for (const item of orderItems) {
    // Try RPC first (recommended)
    const { error: rpcError } = await supabase.rpc('decrement_product_stock', { 
      p_id: item.product_id, 
      decrement_qty: item.quantity 
    })
    
    // Fallback to manual update if RPC fails
    if (rpcError) {
      console.warn(`[Inventory] RPC failed for product ${item.product_id}, using fallback:`, rpcError)
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()
      if (product) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity) })
          .eq('id', item.product_id)
      }
    }
  }
}

// ============================================
// EXISTING INVENTORY FUNCTIONS (Enhanced)
// ============================================

// Get low stock products (Auto-resolves when > 10)
export async function getLowStockAlerts() {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock')
    .lte('stock', 10)
    .eq('is_active', true)
    .order('stock', { ascending: true })
  
  if (error) {
    console.error('Error fetching low stock products:', error)
    return []
  }
  
  return data || []
}

// Get inventory logs for a product
export async function getInventoryLogs(productId: string, limit = 50): Promise<InventoryLog[]> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching inventory logs:', error)
    return []
  }
  
  return data || []
}

// Update product stock with logging (enhanced with reservation check)
export async function updateStock(
  productId: string, 
  newStock: number, 
  reason: string,
  notes?: string,
  checkoutSessionId?: string
): Promise<void> {
  const supabase = await createServerClient()
  const adminSupabase = createAdminClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get current stock
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()
  
  if (fetchError) throw fetchError
  
  const previousStock = product.stock
  const changeAmount = newStock - previousStock
  
  // 🆕 If this is a stock deduction for an order, verify reservation exists
  if (changeAmount < 0 && checkoutSessionId) {
    const { data: reservation } = await supabase
      .from('stock_reservations')
      .select('quantity')
      .eq('checkout_session_id', checkoutSessionId)
      .eq('product_id', productId)
      .single()
    
    if (!reservation) {
      throw new Error(`No stock reservation found for product ${productId}`)
    }
    
    // Release the reservation after successful stock update
    await releaseStockReservation(checkoutSessionId, productId)
  }
  
  // Update product stock using admin client to securely bypass strict RLS constraints
  const { error: updateError } = await adminSupabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)
  
  if (updateError) throw updateError
  
  const finalReason = notes ? `${reason} - ${notes}` : reason

  // Log the change using admin client
  const { error: logError } = await adminSupabase
    .from('inventory_logs')
    .insert({
      product_id: productId,
      previous_stock: previousStock,
      new_stock: newStock,
      change_amount: changeAmount,
      reason: finalReason,
      user_id: session?.user?.id || null,
      checkout_session_id: checkoutSessionId || null,
    })
  
  if (logError) throw logError
}

// Get all inventory logs for global history
export async function getAllInventoryLogs(limit = 100) {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('inventory_logs')
    .select(`
      *,
      products ( name ),
      users ( name, email )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching all inventory logs:', error)
    return []
  }
  
  return data || []
}

// Get inventory summary statistics
export async function getInventoryStats() {
  const supabase = await createServerClient()
  
  // Get total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  // Get low stock products 
  const { count: lowStock } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lte('stock', 10)
    .gt('stock', 0)
  
  // Get out of stock products
  const { count: outOfStock } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('stock', 0)
  
  // Get total inventory value
  const { data: products } = await supabase
    .from('products')
    .select('stock, price')
  
  const totalValue = products?.reduce((sum, p) => sum + (p.stock * p.price), 0) || 0
  
  // Get recent stock changes (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: recentLogs } = await supabase
    .from('inventory_logs')
    .select('change_amount')
    .gte('created_at', sevenDaysAgo.toISOString())
  
  const totalChanges = recentLogs?.reduce((sum, log) => sum + Math.abs(log.change_amount), 0) || 0
  
  return {
    totalProducts: totalProducts || 0,
    lowStockCount: lowStock || 0,
    outOfStockCount: outOfStock || 0,
    totalInventoryValue: totalValue,
    recentStockChanges: totalChanges
  }
}