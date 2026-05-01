// src/app/admin/dashboard/page.tsx

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { siteConfig } from '@/config/site'

// 🚨 Components
import StatsCard from '@/components/admin/StatsCard'
import DashboardCharts from '@/components/admin/DashboardCharts'
import DashboardSearchBar from '@/components/admin/DashboardSearchBar'
import { 
  ShoppingBag, Package, Sparkles, Box, Users, 
  History, IndianRupee, Bell, AlertTriangle, 
  ChevronRight, ArrowUpRight, Zap
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Fetch Aggregated Totals
  const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true })
  const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer')

  // 2. 🚨 REAL-TIME ALERTS ENGINE 🚨
  const { data: lowStockItems } = await supabase.from('products').select('name, stock').lte('stock', 10).limit(3)
  const { data: pendingOrders } = await supabase.from('orders').select('order_number').eq('status', 'pending').limit(3)
  const { data: latestOrders } = await supabase.from('orders').select('order_number, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5)

  // 3. Fetch Top Selling Products
  const { data: topProducts } = await supabase
    .from('order_items')
    .select(`quantity, products (id, name, price, images)`)
    .order('quantity', { ascending: false })
    .limit(4)

  // 4. CHART DATA LOGIC (Aggregation)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const { data: recentOrders } = await supabase.from('orders').select('created_at, total_amount').gte('created_at', thirtyDaysAgo.toISOString()).eq('payment_status', 'paid')

  const chartDataMap = new Map()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    chartDataMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0 })
  }
  recentOrders?.forEach(o => {
    const dStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (chartDataMap.has(dStr)) { const e = chartDataMap.get(dStr); e.revenue += o.total_amount; e.orders += 1; }
  })
  const chartData = Array.from(chartDataMap.values())

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

      {/* 🚨 ANALYTICS VISUALIZATION 🚨 */}
      <DashboardCharts data={chartData} />

      {/* 🚨 RECENT ORDERS & TOP PRODUCTS 🚨 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Latest Activity Feed */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-[#E3E3E3]">Recent Activity</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-[#A8C7FA] hover:underline uppercase">All Orders</Link>
          </div>
          <div className="space-y-4">
            {latestOrders?.map(order => (
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
        </div>

        {/* Top Products Table */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden p-2">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-[#E3E3E3]">Top Selling Products</h2>
          </div>
          <div className="space-y-1">
            {topProducts?.map((item: any, index: number) => (
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
        </div>
      </div>
    </div>
  )
}