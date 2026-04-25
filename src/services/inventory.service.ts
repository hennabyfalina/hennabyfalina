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

// Update product stock with logging
export async function updateStock(
  productId: string, 
  newStock: number, 
  reason: string,
  notes?: string
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
      user_id: session?.user?.id || null
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