// src/app/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/admin/StatsCard'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ShoppingBag, Package, CheckCircle, Users, AlertTriangle, XCircle, IndianRupee } from 'lucide-react'
import { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: `Dashboard | ${siteConfig.shortName} Admin`,
  robots: { index: false, follow: false },
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get current date ranges
  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const startOfYear = new Date()
  startOfYear.setMonth(0, 1)
  startOfYear.setHours(0, 0, 0, 0)

  // Get total orders
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  // Get total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  // Get active products
  const { count: activeProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get total customers
  const { count: totalCustomers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  // Get new customers this month
  const { count: newCustomers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')
    .gte('created_at', startOfMonth.toISOString())

  // Get top products (most sold)
  const { data: topProducts } = await supabase
    .from('order_items')
    .select(`
      quantity,
      products (
        id,
        name,
        price,
        images
      )
    `)
    .order('quantity', { ascending: false })
    .limit(5)

  // Get inventory data explicitly for dashboard stats & alerts
  const { data: inventoryData } = await supabase
    .from('products')
    .select('id, name, stock, price')
    .eq('is_active', true)

  const activeInventory = inventoryData || []
  const lowStockProducts = activeInventory.filter(p => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock)
  const outOfStockProducts = activeInventory.filter(p => p.stock === 0)
  const totalInventoryValue = activeInventory.reduce((sum, p) => sum + (p.stock * p.price), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store's performance</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/admin/orders"
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Grid - Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Orders"
          value={totalOrders || 0}
          icon={<ShoppingBag className="w-5 h-5" />}
          href="/admin/orders"
          color="blue"
        />
        <StatsCard
          title="Total Products"
          value={totalProducts || 0}
          icon={<Package className="w-5 h-5" />}
          href="/admin/products"
          color="purple"
        />
        <StatsCard
          title="Active Products"
          value={activeProducts || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          href="/admin/products"
          color="green"
        />
        <StatsCard
          title="Customers"
          value={totalCustomers || 0}
          icon={<Users className="w-5 h-5" />}
          href="/admin/customers"
          color="blue"
        />
      </div>

      {/* Stats Grid - Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Low Stock (≤10)"
          value={lowStockProducts.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          href="/admin/inventory"
          color="orange"
        />
        <StatsCard
          title="Out of Stock"
          value={outOfStockProducts.length}
          icon={<XCircle className="w-5 h-5" />}
          href="/admin/inventory"
          color="red"
        />
        <StatsCard
          title="Est. Inventory Value"
          value={formatCurrency(totalInventoryValue)}
          icon={<IndianRupee className="w-5 h-5" />}
          href="/admin/inventory"
          color="green"
        />
      </div>

      {/* Inventory Alerts Row */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm font-semibold text-gray-900">Inventory Alerts</h2>
            </div>
            <Link href="/admin/inventory" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all inventory →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {[...outOfStockProducts, ...lowStockProducts].slice(0, 10).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <Link href={`/admin/products/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                  {product.name}
                </Link>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {product.stock === 0 ? 'Out of Stock' : `Low Stock: ${product.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout for Top Products and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Top Selling Products</h2>
          </div>
          
          <div className="divide-y divide-gray-50">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-100">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{item.products?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{item.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency((item.products?.price || 0) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link 
              href="/admin/products/new"
              className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors group"
            >
              <svg className="w-5 h-5 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Add Product</span>
            </Link>
            <Link 
              href="/admin/orders"
              className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors group"
            >
              <svg className="w-5 h-5 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Manage Orders</span>
            </Link>
            <Link 
              href="/admin/categories"
              className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors group"
            >
              <svg className="w-5 h-5 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Categories</span>
            </Link>
            <Link 
              href="/admin/inventory"
              className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors group"
            >
              <svg className="w-5 h-5 text-gray-400 mb-2 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Inventory</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}