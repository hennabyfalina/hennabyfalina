// src/components/admin/DashboardCharts.tsx

'use client'

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ChartData {
  date: string
  revenue: number
  orders: number
}

interface DashboardChartsProps {
  data: ChartData[]
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Custom Tooltip for Revenue to match Gemini Elite UI
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      
      {/* 🚨 REVENUE AREA CHART 🚨 */}
      <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm">
        <div className="mb-6 px-2">
          <h3 className="text-sm font-medium text-[#E3E3E3]">Gross Revenue (30 Days)</h3>
          <p className="text-[11px] text-[#8E9196] uppercase tracking-widest mt-1">Financial Trajectory</p>
        </div>
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A8C7FA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#A8C7FA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#565959" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                minTickGap={20}
              />
              <YAxis 
                stroke="#565959" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
              />
              <Tooltip content={<CustomRevenueTooltip />} cursor={{ stroke: '#565959', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#A8C7FA" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: '#0B57D0', stroke: '#A8C7FA', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🚨 ORDER VOLUME BAR CHART 🚨 */}
      <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm">
        <div className="mb-6 px-2">
          <h3 className="text-sm font-medium text-[#E3E3E3]">Order Volume (30 Days)</h3>
          <p className="text-[11px] text-[#8E9196] uppercase tracking-widest mt-1">Fulfillment Velocity</p>
        </div>
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#565959" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                minTickGap={20}
              />
              <YAxis 
                stroke="#565959" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomOrdersTooltip />} cursor={{ fill: '#282A2C' }} />
              <Bar 
                dataKey="orders" 
                fill="#214332" 
                radius={[4, 4, 0, 0]}
                activeBar={{ fill: '#93D7A4' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}