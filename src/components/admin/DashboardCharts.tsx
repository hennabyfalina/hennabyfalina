// src/components/admin/DashboardCharts.tsx

'use client'

import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { PieChart as PieChartIcon, BarChart as BarChartIcon, ChartBar as ChartBarIcon } from 'lucide-react'
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

export default function DashboardCharts({ revenueData, categoryData, statusData, inventoryData }: DashboardChartsProps) {
  
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131314] border border-[#333538] p-4 rounded-2xl shadow-2xl">
          <p className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-lg font-medium text-[#A8C7FA]">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom Tooltip for Orders
  const CustomOrdersTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131314] border border-[#333538] p-4 rounded-2xl shadow-2xl">
          <p className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">{label}</p>
          <p className="text-lg font-medium text-[#93D7A4]">
            {payload[0].value} <span className="text-xs text-[#8E9196] font-normal">Orders</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131314] border border-[#333538] p-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-sm font-medium text-[#E3E3E3]">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const CustomStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131314] border border-[#333538] p-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-sm font-medium text-[#E3E3E3]">{payload[0].value} <span className="text-[10px] text-[#8E9196] font-normal">Orders</span></p>
        </div>
      )
    }
    return null
  }

  const CustomInventoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131314] border border-[#333538] p-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
          <p className="text-sm font-medium text-[#F9AB00]">{payload[0].value} <span className="text-[10px] text-[#8E9196] font-normal">Units Left</span></p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      
      {/* 🚨 PRIMARY ROW 🚨 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        
        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm">
          <div className="mb-6 px-2">
            <h3 className="text-sm font-medium text-[#E3E3E3]">Gross Revenue</h3>
            <p className="text-[11px] text-[#8E9196] uppercase tracking-widest mt-1">Financial Trajectory</p>
          </div>
          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A8C7FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A8C7FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
                <XAxis dataKey="date" stroke="#565959" fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                <YAxis 
                  stroke="#565959" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  width={75}
                  tickFormatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)} 
                />
                <Tooltip content={<CustomRevenueTooltip />} cursor={{ stroke: '#565959', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke="#A8C7FA" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: '#0B57D0', stroke: '#A8C7FA', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm">
          <div className="mb-6 px-2">
            <h3 className="text-sm font-medium text-[#E3E3E3]">Order Volume</h3>
            <p className="text-[11px] text-[#8E9196] uppercase tracking-widest mt-1">Fulfillment Velocity</p>
          </div>
          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
                <XAxis dataKey="date" stroke="#565959" fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                <YAxis stroke="#565959" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomOrdersTooltip />} cursor={{ fill: '#282A2C' }} />
                <Bar dataKey="orders" fill="#214332" radius={[4, 4, 0, 0]} activeBar={{ fill: '#93D7A4' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🚨 SECONDARY ROW: PIE CHARTS & INVENTORY 🚨 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm flex flex-col">
          <div className="mb-2 px-2">
            <h3 className="text-sm font-medium text-[#E3E3E3]">Sales by Category</h3>
          </div>
          <div className="h-[220px] w-full flex-1">
            {categoryData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#565959]">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">No category sales yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomCategoryTooltip />} cursor={{ stroke: '#565959', strokeWidth: 1 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#8E9196' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm flex flex-col">
          <div className="mb-2 px-2">
            <h3 className="text-sm font-medium text-[#E3E3E3]">Order Statuses</h3>
          </div>
          <div className="h-[220px] w-full flex-1">
            {statusData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#565959]">
                <ChartBarIcon className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">No active orders found</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" outerRadius={75} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8E9196'} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomStatusTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#8E9196' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm flex flex-col">
          <div className="mb-6 px-2">
            <h3 className="text-sm font-medium text-[#E3E3E3]">Critical Inventory</h3>
          </div>
          <div className="h-[200px] w-full flex-1 mt-auto">
            {inventoryData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#565959]">
                <BarChartIcon className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium">Inventory is healthy</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333538" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#8E9196" fontSize={10} tickLine={false} axisLine={false} width={100} tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val} />
                  <Tooltip content={<CustomInventoryTooltip />} cursor={{fill: '#282A2C'}} />
                  <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={16}>
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.stock <= 10 ? '#F9AB00' : '#93D7A4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}