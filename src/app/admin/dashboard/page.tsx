// src/app/admin/dashboard/page.tsx

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatCurrency, formatCompactIndianCurrency, formatDate } from '@/lib/utils'
import { siteConfig } from '@/config/site'

import StatsCard from '@/components/admin/StatsCard'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardSearchBar from '@/components/admin/DashboardSearchBar'
import { 
  ShoppingBag, Package, Sparkles, Box, Users, 
  History, IndianRupee, Bell, AlertTriangle, 
  ChevronRight, ArrowUpRight, Zap, Lock
} from 'lucide-react'
import DashboardDateFilter from '@/components/admin/DashboardDateFilter'

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const resolvedParams = await searchParams
  const range = (resolvedParams?.range as string) || '30d'
  const startParam = resolvedParams?.start as string
  const endParam = resolvedParams?.end as string

  const { data: { user } } = await supabase.auth.getUser()
  let isSuperAdmin = false
  if (user) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).limit(1).maybeSingle()
    isSuperAdmin = userData?.role === 'super_admin'
  }

  // ⚡ FREE-TIER OPTIMIZATION: High-performance flat counts using metadata heads
  const { count: totalOrders } = await adminSupabase.from('orders').select('*', { count: 'exact', head: true })
  const { count: totalProducts } = await adminSupabase.from('products').select('*', { count: 'exact', head: true }).eq('is_deleted', false).eq('is_active', true)
  const { count: totalCustomers } = await adminSupabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer')

  const { data: lowStockItems } = await adminSupabase.from('products').select('name, stock').lte('stock', 10).eq('is_deleted', false).limit(3)
  const { data: pendingOrders } = await adminSupabase.from('orders').select('order_number').eq('status', 'pending').limit(3)
  const { data: latestOrders } = await adminSupabase.from('orders').select('order_number, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5)

  // 🏛️ DECOUPLED MEMORY-STITCHING: Top Selling Products
  const { data: topOrderItems } = await adminSupabase.from('order_items').select('product_id, quantity, price')
  
  const topProductCountsMap = new Map<string, { qty: number; revenue: number }>()
  topOrderItems?.forEach(item => {
    if (!item.product_id) return
    const current = topProductCountsMap.get(item.product_id) || { qty: 0, revenue: 0 }
    topProductCountsMap.set(item.product_id, {
      qty: current.qty + (item.quantity || 0),
      revenue: current.revenue + ((item.quantity || 0) * (item.price || 0))
    })
  })

  const sortedTopProductIds = Array.from(topProductCountsMap.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 4)

  const topProductUUIDs = sortedTopProductIds.map(entry => entry[0])
  const { data: topProductsCatalog } = await adminSupabase.from('products').select('id, name, images').in('id', topProductUUIDs)
  
  const topProductsMap = new Map(topProductsCatalog?.map(p => [p.id, p]) || [])
  const topProducts = sortedTopProductIds.map(([id, stats]) => {
    const prod = topProductsMap.get(id)
    return {
      quantity: stats.qty,
      revenue: stats.revenue,
      products: prod ? { id: prod.id, name: prod.name, images: prod.images } : null
    }
  }).filter(item => item.products !== null)

  let startDate = new Date()
  let endDate = new Date()
  let daysToFetch = 30

  if (range === 'custom' && startParam && endParam) {
    startDate = new Date(startParam)
    endDate = new Date(endParam)
    endDate.setHours(23, 59, 59, 999)
    daysToFetch = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  } else {
    if (range === '3m') daysToFetch = 90
    else if (range === '6m') daysToFetch = 180
    else if (range === '1y') daysToFetch = 365
    startDate.setDate(startDate.getDate() - (daysToFetch - 1))
    startDate.setHours(0, 0, 0, 0)
  }

  const { data: recentOrders } = await adminSupabase
    .from('orders')
    .select('created_at, total_amount')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('payment_status', 'paid')

  const chartDataMap = new Map()
  if (daysToFetch <= 90) {
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date(endDate); d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      chartDataMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 })
    }
    recentOrders?.forEach(o => {
      const dStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (chartDataMap.has(dStr)) { const e = chartDataMap.get(dStr); e.revenue += o.total_amount; e.orders += 1; }
    })
  } else {
    const monthsToFetch = Math.ceil(daysToFetch / 30)
    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const d = new Date(endDate); d.setMonth(d.getMonth() - i)
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      chartDataMap.set(monthStr, { date: monthStr, revenue: 0, orders: 0 })
    }
    recentOrders?.forEach(o => {
      const dStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (chartDataMap.has(dStr)) { const e = chartDataMap.get(dStr); e.revenue += o.total_amount; e.orders += 1; }
    })
  }
  const chartData = Array.from(chartDataMap.values())
  
  // 🏛️ DECOUPLED MEMORY-STITCHING: Category Metrics Mapping
  const { data: orderItemsData } = await adminSupabase.from('order_items').select('quantity, price, product_id')
  const distinctProductIds = Array.from(new Set(orderItemsData?.map(i => i.product_id).filter(Boolean) || []))
  
  const [productsCatalogRes, categoriesListRes] = await Promise.all([
    adminSupabase.from('products').select('id, category_id').in('id', distinctProductIds),
    adminSupabase.from('categories').select('id, name')
  ])

  const productCategoryMap = new Map(productsCatalogRes.data?.map(p => [p.id, p.category_id]) || [])
  const categoryNameMap = new Map(categoriesListRes.data?.map(c => [c.id, c.name]) || [])

  const categoryMap = new Map()
  orderItemsData?.forEach(item => {
    const matchedCategoryId = productCategoryMap.get(item.product_id)
    const catName = matchedCategoryId ? (categoryNameMap.get(matchedCategoryId) || 'Uncategorized') : 'Uncategorized'
    const val = (item.quantity || 0) * (item.price || 0)
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + val)
  })
  const categorySalesData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)

  const { data: allOrdersStatus } = await adminSupabase.from('orders').select('status')
  const statusMap = new Map()
  allOrdersStatus?.forEach(o => {
    const formattedStatus = o.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    statusMap.set(formattedStatus, (statusMap.get(formattedStatus) || 0) + 1)
  })
  const orderStatusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }))

  const { data: inventoryData } = await adminSupabase.from('products').select('name, stock').eq('is_deleted', false).order('stock', { ascending: true }).limit(6)

  return (
    <div className="space-y-8 pt-4 md:pt-6 pb-12 text-left font-sans antialiased select-none">
      <div className="w-full">
        <h1 className="text-[28px] md:text-3xl font-normal admin-text-primary tracking-tight leading-tight mb-2">
          Hi {siteConfig.name}
        </h1>
        <h2 className="text-xl md:text-[28px] admin-text-accent font-medium tracking-tight">
          System Overview & Performance
        </h2>
        <DashboardSearchBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-bg-card border border-solid admin-border rounded-[32px] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-4 h-4 admin-text-accent" />
            <h3 className="text-sm font-bold admin-text-primary uppercase tracking-widest">Real-time Activity</h3>
          </div>
          <div className="space-y-3">
            {pendingOrders?.map(o => (
              <div key={o.order_number} className="flex items-center justify-between p-4 admin-bg-primary rounded-2xl border border-solid admin-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F9AB00] animate-pulse" />
                  <span className="text-sm admin-text-primary">Order <span className="font-mono admin-text-accent">{o.order_number}</span> is pending fulfillment</span>
                </div>
                <Link href="/admin/orders" className="admin-text-muted hover:admin-text-primary transition-colors text-decoration-none outline-none"><ArrowUpRight className="w-4 h-4" /></Link>
              </div>
            ))}
            {lowStockItems?.map(i => (
              <div key={i.name} className="flex items-center justify-between p-4 bg-[#3C1E0A]/20 rounded-2xl border border-solid border-[#4E270D]/40">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#F9AB00]" />
                  <span className="text-sm text-[#F9AB00] font-medium capitalize">Critical Stock: {i.name.toLowerCase()} ({i.stock} left)</span>
                </div>
                <Link href="/admin/inventory" className="text-[#F9AB00] hover:scale-110 transition-transform text-decoration-none outline-none"><Zap className="w-4 h-4" /></Link>
              </div>
            ))}
            {pendingOrders?.length === 0 && lowStockItems?.length === 0 && (
              <p className="text-sm text-[#565959] text-center py-4 italic font-medium">No critical alerts detected.</p>
            )}
          </div>
        </div>

        <div className="admin-bg-card border border-solid admin-border rounded-[32px] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 admin-text-accent" />
            <h3 className="text-sm font-bold admin-text-primary uppercase tracking-widest">Utility Tools</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Audit Logs', icon: History, href: '/admin/inventory/logs' },
              { label: 'Finance Ledger', icon: IndianRupee, href: '/admin/finance' },
              { label: 'Catalog Sync', icon: Package, href: '/admin/products' },
              { label: 'User Directory', icon: Users, href: '/admin/customers' },
            ].map((tool) => (
              <Link key={tool.label} href={tool.href} className="flex items-center gap-3 p-4 admin-bg-primary hover:admin-bg-elevated border border-solid admin-border rounded-2xl transition-all group text-decoration-none outline-none">
                <tool.icon className="w-4 h-4 admin-text-muted group-hover:admin-text-accent transition-colors" />
                <span className="text-sm admin-text-secondary group-hover:admin-text-primary transition-colors">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Orders" value={totalOrders || 0} icon={<ShoppingBag className="w-5 h-5" />} />
        <StatsCard title="Active Products" value={totalProducts || 0} icon={<Box className="w-5 h-5" />} />
        <StatsCard title="Verified Customers" value={totalCustomers || 0} icon={<Users className="w-5 h-5" />} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4 z-20 relative px-2 md:px-0">
          <div>
            <h2 className="text-lg font-bold admin-text-primary tracking-tight">Business Intelligence</h2>
            <p className="text-sm admin-text-muted hidden sm:block mt-0.5">Interactive visualizations and trend metrics.</p>
          </div>
          <DashboardDateFilter />
        </div>

        {!isSuperAdmin && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center admin-bg-primary/60 backdrop-blur-md rounded-[32px] border border-solid admin-border">
            <Lock className="w-8 h-8 text-[#F9AB00] mb-3" />
            <p className="admin-text-primary font-medium text-lg">Super Admin Required</p>
            <p className="admin-text-muted text-sm mt-1">Analytics viewing is restricted.</p>
          </div>
        )}
        <div className={`w-full ${!isSuperAdmin ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          <DashboardCharts 
            revenueData={chartData} 
            categoryData={categorySalesData} 
            statusData={orderStatusData} 
            inventoryData={inventoryData || []} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="admin-bg-card rounded-[32px] border border-solid admin-border overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium admin-text-primary">Recent Activity</h2>
            <Link href="/admin/orders" className="text-xs font-bold admin-text-accent hover:underline uppercase text-decoration-none outline-none">All Orders</Link>
          </div>
          {(!latestOrders || latestOrders.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-500">
              <History className="w-10 h-10 admin-text-muted mb-3" />
              <p className="text-base font-medium admin-text-secondary">No recent activity</p>
              <p className="text-sm admin-text-muted mt-1 max-w-xs mx-auto leading-relaxed">When customers place orders, they will appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestOrders.map(order => (
                <div key={order.order_number} className="flex items-center justify-between py-3 border-b border-solid admin-border last:border-0">
                  <div>
                    <p className="text-sm font-mono admin-text-primary">{order.order_number}</p>
                    <p className="text-[11px] admin-text-muted mt-0.5 font-mono">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold admin-text-primary font-mono">{formatCurrency(order.total_amount)}</p>
                    <p className="text-[10px] uppercase font-bold text-[#93D7A4] tracking-wider mt-0.5">{order.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative admin-bg-card rounded-[32px] border border-solid admin-border overflow-hidden p-6 min-h-[320px] md:min-h-0">
          {!isSuperAdmin && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center admin-bg-primary/60 backdrop-blur-md">
              <Lock className="w-6 h-6 text-[#F9AB00] mb-2" />
              <p className="admin-text-primary font-medium text-center px-4">Restricted Access</p>
              <p className="admin-text-muted text-sm mt-1">Top selling products viewing is restricted.</p>
            </div>
          )}
          <div className={!isSuperAdmin ? 'opacity-40 pointer-events-none select-none' : ''}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium admin-text-primary">Top Selling Products</h2>
              <Link href="/admin/products" className="text-xs font-bold admin-text-accent hover:underline uppercase text-decoration-none outline-none">All Products</Link>
            </div>
          </div>
          {(!topProducts || topProducts.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-500">
              <Package className="w-10 h-10 admin-text-muted mb-3" />
              <p className="text-base font-medium admin-text-secondary">No sales data yet</p>
              <p className="text-sm admin-text-muted mt-1 max-w-xs mx-auto leading-relaxed">Top performing products will be ranked here once sales begin.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {topProducts.map((item: any, index: number) => {
                if (!item.products) return null;
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-[24px] hover:admin-bg-elevated transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium admin-text-accent admin-bg-primary border border-solid admin-border font-mono">{index + 1}</div>
                      <div>
                        <p className="text-[15px] font-medium admin-text-primary line-clamp-1 capitalize">{item.products.name.toLowerCase()}</p>
                        <p className="text-xs admin-text-muted mt-0.5 font-medium">{item.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-[#93D7A4] font-mono">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}