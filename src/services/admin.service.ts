// src/services/admin.service.ts

import { SupabaseClient } from '@supabase/supabase-js'
import { getStartOfMonth } from '@/lib/utils'

export async function getDashboardStats(supabase: SupabaseClient) {
  const startOfMonth = getStartOfMonth()

  const [
    { count: totalOrders },
    { count: totalProducts },
    { count: activeProducts },
    { count: totalCustomers },
    { count: newCustomers }
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', startOfMonth)
  ])

  return {
    totalOrders: totalOrders || 0,
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    totalCustomers: totalCustomers || 0,
    newCustomers: newCustomers || 0
  }
}

export async function getTopProducts(supabase: SupabaseClient, limit: number = 5) {
  const { data } = await supabase
    .from('order_items')
    .select(`quantity, products (id, name, price, images)`)
    .order('quantity', { ascending: false })
    .limit(limit)
  
  return data || []
}

export async function getInventoryAlerts(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('products')
    .select('id, name, stock, price')
    .eq('is_active', true)

  const activeInventory = data || []
  
  const lowStock = activeInventory.filter(p => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock)
  const outOfStock = activeInventory.filter(p => p.stock === 0)
  const totalValue = activeInventory.reduce((sum, p) => sum + (p.stock * p.price), 0)

  return {
    lowStock,
    outOfStock,
    totalValue
  }
}