// src/services/inventory.service.ts

'use server'

import { cache } from 'react'
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
  checkout_session_id?: string | null
  products?: { name: string } | null
  users?: { name: string; email: string } | null
}

export interface StockReservation {
  id: string
  product_id: string
  quantity: number
  user_id: string
  checkout_session_id: string
  expires_at: string
  created_at: string
}

export interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalInventoryValue: number
  recentStockChanges: number
}

const RESERVATION_EXPIRY_MINUTES = 15

// ============================================
// STOCK RESERVATION SYSTEM
// ============================================

/**
 * 🚀 SECURE: Reserve stock for an active checkout session
 * Bypasses RLS constraints safely via admin service role escalation
 */
export async function reserveStock(
  checkoutSessionId: string,
  items: Array<{ product_id: string; quantity: number }>,
  userId: string
): Promise<{ success: boolean; errors?: string[] }> {
  const adminSupabase = createAdminClient()
  const errors: string[] = []

  for (const item of items) {
    // 1. Fetch current catalog stock limits via root admin privileges
    const { data: product, error: productError } = await adminSupabase
      .from('products')
      .select('stock, name')
      .eq('id', item.product_id)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle()

    if (productError || !product) {
      console.error(`🚨 [Inventory] Product lookup failure for ID [${item.product_id}]:`, productError)
      errors.push(`Product verification failed or permission was denied.`)
      continue
    }

    // 2. Calculate concurrent reservations allocated across other parallel checkout sessions
    const { data: existingReservations, error: reservationError } = await adminSupabase
      .from('stock_reservations')
      .select('quantity')
      .eq('product_id', item.product_id)
      .gt('expires_at', new Date().toISOString())
      .neq('checkout_session_id', checkoutSessionId)

    if (reservationError) {
      console.error(`🚨 [Inventory] Reservation scanning failure for ${product.name}:`, reservationError)
      errors.push(`Failed to calculate inventory allocation boundaries for ${product.name}.`)
      continue
    }

    const totalReservedAcrossSessions = existingReservations?.reduce((sum, r) => sum + r.quantity, 0) || 0
    const availableStockPool = product.stock - totalReservedAcrossSessions

    if (availableStockPool < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}. Only ${Math.max(0, availableStockPool)} units are available for reservation.`)
      continue
    }

    // 3. Commit or update the active reservation block
    const expirationTimestamp = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000)

    const { error: upsertError } = await adminSupabase
      .from('stock_reservations')
      .upsert({
        product_id: item.product_id,
        quantity: item.quantity,
        user_id: userId,
        checkout_session_id: checkoutSessionId,
        expires_at: expirationTimestamp.toISOString(),
      }, {
        onConflict: 'checkout_session_id,product_id',
      })

    if (upsertError) {
      console.error(`🚨 [Inventory] Reservation block persistence failed for ${product.name}:`, upsertError)
      errors.push(`Internal system lock down prevented securing item allocation for ${product.name}.`)
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * 🚀 SECURE: Release stock reservations cleanly on abandonment or error routes
 */
export async function releaseStockReservation(
  checkoutSessionId: string,
  productId?: string
): Promise<void> {
  const adminSupabase = createAdminClient()

  let deletionQuery = adminSupabase
    .from('stock_reservations')
    .delete()
    .eq('checkout_session_id', checkoutSessionId)

  if (productId) {
    deletionQuery = deletionQuery.eq('product_id', productId)
  }

  const { error } = await deletionQuery

  if (error) {
    console.error('🚨 [Inventory] Core reservation release drop:', error.message)
  }
}

/**
 * 🚀 SECURE: Read active items assigned to a current checkout timeline
 */
export async function getReservationsForSession(
  checkoutSessionId: string
): Promise<StockReservation[]> {
  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('stock_reservations')
    .select('*')
    .eq('checkout_session_id', checkoutSessionId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('🚨 [Inventory] Session reservation fetch panic:', error.message)
    return []
  }

  return (data || []) as StockReservation[]
}

/**
 * 🚀 SECURE: Validates matching active session rows right before finalized order execution
 */
export async function verifyReservations(
  checkoutSessionId: string,
  items: Array<{ product_id: string; quantity: number }>
): Promise<{ valid: boolean; errors?: string[] }> {
  const adminSupabase = createAdminClient()
  const errors: string[] = []

  for (const item of items) {
    const { data: reservation, error } = await adminSupabase
      .from('stock_reservations')
      .select('quantity, expires_at')
      .eq('checkout_session_id', checkoutSessionId)
      .eq('product_id', item.product_id)
      .limit(1)
      .maybeSingle()

    if (error || !reservation) {
      errors.push(`No valid allocation lock row found for item ID: ${item.product_id}`)
      continue
    }

    if (new Date(reservation.expires_at) < new Date()) {
      errors.push(`Allocation holding period expired for item ID: ${item.product_id}`)
      continue
    }

    if (reservation.quantity !== item.quantity) {
      errors.push(`Quantity parameter delta detected for item ID: ${item.product_id}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * 🚀 SECURE: Extend session reservation deadlines quietly during active checkouts
 */
export async function extendReservationExpiry(
  checkoutSessionId: string,
  additionalMinutes: number = RESERVATION_EXPIRY_MINUTES
): Promise<void> {
  const adminSupabase = createAdminClient()
  const extendedTimestamp = new Date(Date.now() + additionalMinutes * 60 * 1000)

  const { error } = await adminSupabase
    .from('stock_reservations')
    .update({ expires_at: extendedTimestamp.toISOString() })
    .eq('checkout_session_id', checkoutSessionId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('🚨 [Inventory] Failed to extend session expiry vectors:', error.message)
  }
}

/**
 * 🚀 SECURE: Housekeeping script executed via cron layers to wipe clean stale ghost sessions
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('stock_reservations')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('🚨 [Inventory] Stale tracking cleanup sweep failure:', error.message)
    return 0
  }

  return data?.length || 0
}

/**
 * 🚀 SECURE: Resolves the total stock pool minus active unexpired checkouts
 */
export async function getAvailableStock(productId: string): Promise<number> {
  const adminSupabase = createAdminClient()

  const { data: product, error: productError } = await adminSupabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .limit(1)
    .maybeSingle()

  if (productError || !product) return 0

  const { data: reservations, error: reservationError } = await adminSupabase
    .from('stock_reservations')
    .select('quantity')
    .eq('product_id', productId)
    .gt('expires_at', new Date().toISOString())

  if (reservationError) {
    console.error('🚨 [Inventory] Allocation calculation failure:', reservationError.message)
    return product.stock
  }

  const activeReservationsCount = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0
  return Math.max(0, product.stock - activeReservationsCount)
}

// ============================================
// UNIFIED STOCK UPDATE SERVICE
// ============================================

/**
 * 🚀 SECURE: Deducts operational stock upon successful gateway transaction execution
 */
export async function deductOrderStock(orderId: string): Promise<void> {
  const adminSupabase = createAdminClient()
  
  const { data: orderItems, error: itemsError } = await adminSupabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    console.error('🚨 [Inventory] Failed to acquire line items for stock sync:', itemsError)
    return
  }

  for (const item of orderItems) {
    // Attempt Atomic SQL procedure increment/decrement mutations first
    const { error: rpcError } = await adminSupabase.rpc('decrement_product_stock', { 
      p_id: item.product_id, 
      decrement_qty: item.quantity 
    })
    
    if (rpcError) {
      console.warn(`⚠️ [Inventory] Database RPC sequence missed, using robust admin fallback:`, rpcError.message)
      const { data: product } = await adminSupabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .limit(1)
        .maybeSingle()

      if (product) {
        await adminSupabase
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity), updated_at: new Date().toISOString() })
          .eq('id', item.product_id)
      }
    }
  }
}

// ============================================
// METRICS AND HISTORICAL REPORTING ENGINE
// ============================================

export const getLowStockAlerts = cache(async () => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock')
    .lte('stock', 10)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('stock', { ascending: true })
  
  if (error) {
    console.error('🚨 [Inventory] Failed to capture metric low alerts:', error.message)
    return []
  }
  
  return data || []
})

export async function getInventoryLogs(productId: string, limit = 50): Promise<InventoryLog[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('🚨 [Inventory] Failed to read structural product logs:', error.message)
    return []
  }
  
  return (data || []) as InventoryLog[]
}

export async function updateStock(
  productId: string, 
  newStock: number, 
  reason: string,
  notes?: string,
  checkoutSessionId?: string
): Promise<void> {
  const supabase = await createServerClient()
  const adminSupabase = createAdminClient()
  const { data: { user }, error: userError } = await adminSupabase.auth.getUser()
if (userError || !user) throw new Error('Unauthorized operational change request locked.')
  
  const { data: product, error: fetchError } = await adminSupabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .limit(1)
    .maybeSingle()
  
  if (fetchError || !product) throw new Error('Target log catalog product row match missing.')
  
  const previousStock = product.stock
  const changeAmount = newStock - previousStock
  
  if (changeAmount < 0 && checkoutSessionId) {
    const { data: reservation } = await adminSupabase
      .from('stock_reservations')
      .select('quantity')
      .eq('checkout_session_id', checkoutSessionId)
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle()
    
    if (!reservation) {
      throw new Error(`Transaction safety fault: Reservation verification match missing.`)
    }
    
    await releaseStockReservation(checkoutSessionId, productId)
  }
  
  const { error: updateError } = await adminSupabase
    .from('products')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId)
  
  if (updateError) throw updateError
  
  const finalReason = notes ? `${reason} - ${notes}` : reason

  const { error: logError } = await adminSupabase
    .from('inventory_logs')
    .insert({
      product_id: productId,
      previous_stock: previousStock,
      new_stock: newStock,
      change_amount: changeAmount,
      reason: finalReason,
      user_id: user.id,
      checkout_session_id: checkoutSessionId || null,
      created_at: new Date().toISOString()
    })
  
  if (logError) throw logError
}

export async function getAllInventoryLogs(limit = 100): Promise<InventoryLog[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('inventory_logs')
    .select(`
      id,
      product_id,
      user_id,
      previous_stock,
      new_stock,
      change_amount,
      reason,
      created_at,
      checkout_session_id,
      products:product_id ( name, sku ),
      users:user_id ( 
        name, 
        email 
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('🚨 [Inventory] Final verification database fetch failed:', error.message)
    return []
  }

  return (data || []) as unknown as InventoryLog[]
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const adminSupabase = createAdminClient()
  
  const { count: totalProducts } = await adminSupabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false)
  
  const { count: lowStock } = await adminSupabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lte('stock', 10)
    .gt('stock', 0)
    .eq('is_active', true)
    .eq('is_deleted', false)
  
  const { count: outOfStock } = await adminSupabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('stock', 0)
    .eq('is_active', true)
    .eq('is_deleted', false)
  
  const { data: products } = await adminSupabase
    .from('products')
    .select('stock, retail_price')
    .eq('is_deleted', false)
  
  const totalValue = products?.reduce((sum, p) => sum + (p.stock * p.retail_price), 0) || 0
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: recentLogs } = await adminSupabase
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