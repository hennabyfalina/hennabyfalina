// src/components/admin/DashboardCharts.tsx

'use client'

import { useState, useEffect } from 'react'
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { PieChart as PieChartIcon, BarChart as BarChartIcon, ChartBar as ChartBarIcon, LineChart as LineChartIcon, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const CATEGORY_COLORS = ['#A8C7FA', '#93D7A4', '#F9AB00', '#F2B8B5', '#D0BCFF', '#E3E3E3']
const STATUS_COLORS: Record<string, string> = {
  'Pending': '#F1DF9E', 'Confirmed': '#A8C7FA', 'Processing': '#D0BCFF',
  'Packed': '#A8C7FA', 'Shipped': '#FFB4A8', 'Delivered': '#93D7A4',
  'Cancelled': '#F2B8B5', 'Cancel Requested': '#F2B8B5', 'Return Requested': '#F9AB00', 'Returned': '#E3E3E3'
}

interface DashboardChartsProps {
  revenueData: any[]
  categoryData: any[]
  statusData: any[]
  inventoryData: any[]
}

const formatCompactNumber = (value: number) => {
  if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`
  return `₹${value}`
}

// 🚨 MOVED OUTSIDE COMPONENT - FIXES THE ERROR
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="admin-bg-primary border admin-border p-3 rounded-xl shadow-xl">
        <p className="text-[11px] font-bold admin-text-muted uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-medium admin-text-accent">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

// 🚨 MOVED OUTSIDE COMPONENT - FIXES THE ERROR
const CustomInventoryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="admin-bg-primary border admin-border p-3 rounded-xl shadow-xl max-w-[200px]">
        <p className="text-[11px] font-bold admin-text-muted uppercase tracking-widest mb-1 truncate">{label}</p>
        <p className="text-sm font-medium text-[#F2B8B5]">Stock: {payload[0].value} units</p>
      </div>
    )
  }
  return null
}

const EmptyState = ({ icon: Icon, title, message }: any) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
    <div className="w-14 h-14 admin-bg-primary border admin-border rounded-full flex items-center justify-center mb-4 shadow-inner">
      <Icon className="w-6 h-6 admin-text-muted" />
    </div>
    <h4 className="text-[15px] font-bold admin-text-primary mb-1.5 tracking-tight">{title}</h4>
    <p className="text-sm admin-text-muted max-w-[220px] leading-relaxed">{message}</p>
  </div>
)

export default function DashboardCharts({ revenueData, categoryData, statusData, inventoryData }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const hasRevenue = revenueData?.length > 0 && revenueData.some(d => d.revenue > 0)

  return (
    <div className="flex flex-col gap-6">
      
      <div className="admin-bg-card border admin-border rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
        <div className="mb-2 px-2"><h3 className="text-sm font-medium admin-text-primary">Revenue Timeline</h3></div>
        <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
          {!isMounted ? (
             <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
          ) : !hasRevenue ? (
            <EmptyState 
              icon={LineChartIcon} 
              title="The Vault is Quiet" 
              message="Awaiting the first wave of sales to paint this chart green." 
            />
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A8C7FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A8C7FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} />
                <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--admin-border)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey="revenue" stroke="#A8C7FA" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="admin-bg-card border admin-border rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
          <div className="mb-2 px-2"><h3 className="text-sm font-medium admin-text-primary">Sales by Category</h3></div>
          <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
            {!isMounted ? (
              <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
            ) : categoryData.length === 0 ? (
              <EmptyState 
                icon={PieChartIcon} 
                title="Zero-Calorie Hologram" 
                message="No category data yet. Waiting for orders to slice up this pie." 
              />
            ) : (
              <ResponsiveContainer width="99%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--admin-text-primary)', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-bg-card border admin-border rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
          <div className="mb-2 px-2"><h3 className="text-sm font-medium admin-text-primary">Order Status</h3></div>
          <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
            {!isMounted ? (
              <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
            ) : statusData.length === 0 ? (
              <EmptyState 
                icon={ChartBarIcon} 
                title="Radar is Clear" 
                message="No active orders in orbit right now. Time for a coffee break." 
              />
            ) : (
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'var(--admin-bg-elevated)'}} contentStyle={{ backgroundColor: 'var(--admin-bg-primary)', borderColor: 'var(--admin-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--admin-text-primary)' }} itemStyle={{ color: 'var(--admin-text-primary)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#A8C7FA'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-bg-card border admin-border rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
          <div className="mb-2 px-2"><h3 className="text-sm font-medium admin-text-primary">Critical Inventory</h3></div>
          <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0 overflow-y-auto no-scrollbar">
            {!isMounted ? (
              <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
            ) : inventoryData.length === 0 ? (
              <EmptyState 
                icon={Sparkles} 
                title="Shelves are Healthy" 
                message="No critical low-stock items. Your inventory is looking flawless. ✨" 
              />
            ) : (
              <div style={{ height: Math.max(320, inventoryData.length * 45), width: '100%' }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={inventoryData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={80} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                    <Tooltip content={<CustomInventoryTooltip />} cursor={{fill: '#282A2C'}} />
                    <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={16}>
                      {inventoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.stock < 50 ? '#F2B8B5' : '#F9AB00'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}