// src/app/admin/dashboard/page.tsx

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatCurrency, formatCompactIndianCurrency, formatDate } from '@/lib/utils'
import { siteConfig } from '@/config/site'

// 🚨 Components
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

  // 0. Fetch User Role for Permissions
  const { data: { user } } = await supabase.auth.getUser()
  let isSuperAdmin = false
  if (user) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    isSuperAdmin = userData?.role === 'super_admin'
  }

  // 1. Fetch Aggregated Totals
  const { count: totalOrders } = await adminSupabase.from('orders').select('*', { count: 'exact', head: true })
  const { count: totalProducts } = await adminSupabase.from('products').select('*', { count: 'exact', head: true })
  const { count: totalCustomers } = await adminSupabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer')

  // 2. 🚨 REAL-TIME ALERTS ENGINE 🚨
  const { data: lowStockItems } = await adminSupabase.from('products').select('name, stock').lte('stock', 10).limit(3)
  const { data: pendingOrders } = await adminSupabase.from('orders').select('order_number').eq('status', 'pending').limit(3)
  const { data: latestOrders } = await adminSupabase.from('orders').select('order_number, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5)

  // 3. Fetch Top Selling Products
  const { data: topProducts } = await adminSupabase
    .from('order_items')
    .select(`quantity, products (id, name, price, images)`)
    .order('quantity', { ascending: false })
    .limit(4)

  // 4. CHART DATA LOGIC (Aggregation)
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
  
  // 5. CATEGORY SALES DATA (Donut Chart)
  const { data: orderItemsData } = await adminSupabase
    .from('order_items')
    .select(`quantity, price, products(category:categories(name))`)
  
  const categoryMap = new Map()
  orderItemsData?.forEach(item => {
    const catName = (item.products as any)?.category?.name || 'Uncategorized'
    const val = (item.quantity || 0) * (item.price || 0)
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + val)
  })
  const categorySalesData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)

  // 6. ORDER STATUS DISTRIBUTION (Pie Chart)
  const { data: allOrdersStatus } = await adminSupabase.from('orders').select('status')
  const statusMap = new Map()
  allOrdersStatus?.forEach(o => {
    const formattedStatus = o.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    statusMap.set(formattedStatus, (statusMap.get(formattedStatus) || 0) + 1)
  })
  const orderStatusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }))

  // 7. INVENTORY HEALTH (Bar Chart)
  const { data: inventoryData } = await adminSupabase.from('products').select('name, stock').order('stock', { ascending: true }).limit(6)

  return (
    <div className="space-y-8 pt-4 md:pt-6 pb-12">
      
      {/* 🚨 GEMINI GREETING 🚨 */}
      <div className="w-full">
        <h1 className="text-[28px] md:text-3xl font-normal text-[#E3E3E3] tracking-tight leading-tight mb-2">
          Hi {siteConfig.name}
        </h1>
        <h2 className="text-xl md:text-[28px] text-[#A8C7FA] font-medium tracking-tight">
          System Overview & Performance
        </h2>

        {/* Global Search Bar (Trigger) */}
        <DashboardSearchBar />
      </div>

      {/* 🚨 NOTIFICATIONS & ALERTS SECTION 🚨 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-4 h-4 text-[#A8C7FA]" />
            <h3 className="text-sm font-bold text-[#E3E3E3] uppercase tracking-widest">Real-time Activity</h3>
          </div>
          <div className="space-y-3">
            {pendingOrders?.map(o => (
              <div key={o.order_number} className="flex items-center justify-between p-4 bg-[#131314] rounded-2xl border border-[#333538]/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F9AB00] animate-pulse" />
                  <span className="text-sm text-[#E3E3E3]">Order <span className="font-mono text-[#A8C7FA]">{o.order_number}</span> is pending fulfillment</span>
                </div>
                <Link href="/admin/orders" className="text-[#8E9196] hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></Link>
              </div>
            ))}
            {lowStockItems?.map(i => (
              <div key={i.name} className="flex items-center justify-between p-4 bg-[#3C1E0A]/20 rounded-2xl border border-[#4E270D]/40">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#F9AB00]" />
                  <span className="text-sm text-[#F9AB00] font-medium">Critical Stock: {i.name} ({i.stock} left)</span>
                </div>
                <Link href="/admin/inventory" className="text-[#F9AB00] hover:scale-110 transition-transform"><Zap className="w-4 h-4" /></Link>
              </div>
            ))}
            {pendingOrders?.length === 0 && lowStockItems?.length === 0 && (
              <p className="text-sm text-[#565959] text-center py-4 italic">No critical alerts detected.</p>
            )}
          </div>
        </div>

        {/* 🚨 QUICK TOOLS 🚨 */}
        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-[#A8C7FA]" />
            <h3 className="text-sm font-bold text-[#E3E3E3] uppercase tracking-widest">Utility Tools</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Audit Logs', icon: History, href: '/admin/inventory/logs' },
              { label: 'Finance Ledger', icon: IndianRupee, href: '/admin/finance' },
              { label: 'Catalog Sync', icon: Package, href: '/admin/products' },
              { label: 'User Directory', icon: Users, href: '/admin/customers' },
            ].map((tool) => (
              <Link key={tool.label} href={tool.href} className="flex items-center gap-3 p-4 bg-[#131314] hover:bg-[#282A2C] border border-[#333538] rounded-2xl transition-all group">
                <tool.icon className="w-4 h-4 text-[#8E9196] group-hover:text-[#A8C7FA]" />
                <span className="text-sm text-[#C4C7C5] group-hover:text-[#E3E3E3]">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 🚨 CORE STATS GRID 🚨 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Orders" value={totalOrders || 0} icon={<ShoppingBag className="w-5 h-5" />} />
        <StatsCard title="Active Products" value={totalProducts || 0} icon={<Box className="w-5 h-5" />} />
        <StatsCard title="Verified Customers" value={totalCustomers || 0} icon={<Users className="w-5 h-5" />} />
      </div>

      {/* 🚨 BUSINESS INTELLIGENCE & ANALYTICS (Super Admin Only) 🚨 */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4 z-20 relative px-2 md:px-0">
          <div>
            <h2 className="text-lg font-bold text-[#E3E3E3] tracking-tight">Business Intelligence</h2>
            <p className="text-sm text-[#8E9196] hidden sm:block">Interactive visualizations and financial metrics.</p>
          </div>
          <DashboardDateFilter />
        </div>

        {!isSuperAdmin && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#131314]/60 backdrop-blur-md rounded-[32px] border border-[#333538]">
            <Lock className="w-8 h-8 text-[#F9AB00] mb-3" />
            <p className="text-[#E3E3E3] font-medium text-lg">Super Admin Required</p>
            <p className="text-[#8E9196] text-sm mt-1">Analytics viewing is restricted.</p>
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

      {/* 🚨 RECENT ORDERS & TOP PRODUCTS 🚨 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Latest Activity Feed */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-[#E3E3E3]">Recent Activity</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-[#A8C7FA] hover:underline uppercase">All Orders</Link>
          </div>
          {(!latestOrders || latestOrders.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-500">
              <History className="w-10 h-10 text-[#333538] mb-3" />
              <p className="text-base font-medium text-[#C4C7C5]">No recent activity</p>
              <p className="text-sm text-[#8E9196] mt-1 max-w-xs mx-auto">When customers place orders, they will appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestOrders.map(order => (
                <div key={order.order_number} className="flex items-center justify-between py-3 border-b border-[#333538] last:border-0">
                  <div>
                    <p className="text-sm font-mono text-[#E3E3E3]">{order.order_number}</p>
                    <p className="text-[11px] text-[#8E9196] mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#E3E3E3]">{formatCurrency(order.total_amount)}</p>
                    <p className="text-[10px] uppercase font-bold text-[#93D7A4] tracking-tighter">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="relative bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden p-2 min-h-[320px] md:min-h-0">
          {!isSuperAdmin && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#131314]/60 backdrop-blur-md">
              <Lock className="w-6 h-6 text-[#F9AB00] mb-2" />
              <p className="text-[#E3E3E3] font-medium text-center px-4">Restricted Access</p>
              <p className="text-[#8E9196] text-sm mt-1">Top selling products viewing is restricted.</p>
            </div>
          )}
          <div className={!isSuperAdmin ? 'opacity-40 pointer-events-none select-none' : ''}>
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-medium text-[#E3E3E3]">Top Selling Products</h2>
              <Link href="/admin/products" className="text-xs font-bold text-[#A8C7FA] hover:underline uppercase">All Products</Link>
            </div>
          </div>
          {(!topProducts || topProducts.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-500">
              <Package className="w-10 h-10 text-[#333538] mb-3" />
              <p className="text-base font-medium text-[#C4C7C5]">No sales data yet</p>
              <p className="text-sm text-[#8E9196] mt-1 max-w-xs mx-auto">Top performing products will be ranked here once sales begin.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {topProducts.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-[24px] hover:bg-[#282A2C] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-[#A8C7FA] bg-[#131314] border border-[#333538]">{index + 1}</div>
                    <div>
                      <p className="text-[15px] font-medium text-[#E3E3E3] line-clamp-1">{item.products?.name || 'Unknown'}</p>
                      <p className="text-sm text-[#8E9196] mt-0.5">{item.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-medium text-[#93D7A4]">{formatCurrency((item.products?.price || 0) * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}