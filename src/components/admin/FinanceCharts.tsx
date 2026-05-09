// src/components/admin/FinanceCharts.tsx

'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FileLineChart, Wallet } from 'lucide-react'
import { formatCurrency, formatCompactIndianCurrency } from '@/lib/utils'

const formatCompactNumber = (value: number) => {
  if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`
  return `₹${value}`
}

// 🍎 APPLE-STYLE EMPTY STATE COMPONENT
const EmptyState = ({ icon: Icon, title, message }: any) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
    <div className="w-14 h-14 bg-[#131314] border border-[#333538] rounded-full flex items-center justify-center mb-4 shadow-inner">
      <Icon className="w-6 h-6 text-[#8E9196]" />
    </div>
    <h4 className="text-[15px] font-bold text-[#E3E3E3] mb-1.5 tracking-tight">{title}</h4>
    <p className="text-sm text-[#8E9196] max-w-[240px] leading-relaxed">{message}</p>
  </div>
)

export default function FinanceCharts({ timelineData, cashflowData }: { timelineData: any[], cashflowData: any[] }) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  // 🚨 THE FIX: Verify actual values exist, not just empty dates
  const hasTimeline = timelineData?.length > 0 && timelineData.some(d => d.income > 0 || d.gst > 0 || d.refunds > 0)
  const hasCashflow = cashflowData?.length > 0 && cashflowData.some(d => d.value > 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131314] border border-[#333538] p-4 rounded-2xl shadow-2xl">
          <p className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest mb-2">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium flex justify-between gap-4" style={{ color: entry.color || entry.payload.color }}>
              <span>{entry.name}:</span>
              <span>{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
      
      {/* Timeline Bar Chart */}
      <div className="xl:col-span-2 bg-[#1E1F20] border border-[#333538] rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
        <div className="mb-2 px-2">
          <h3 className="text-sm font-medium text-[#E3E3E3]">Income & Tax Timeline</h3>
        </div>
        <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
          ) : !hasTimeline ? (
            <EmptyState 
              icon={FileLineChart} 
              title="Pristine Ledger" 
              message="No income or taxes to report yet. The accountant is taking a nap. 😴" 
            />
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
                <XAxis dataKey="date" stroke="#8E9196" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#8E9196" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactIndianCurrency} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#282A2C'}} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#E3E3E3' }} />
                <Bar dataKey="income" name="Taxable Income" stackId="a" fill="#93D7A4" radius={[0, 0, 4, 4]} maxBarSize={40} />
                <Bar dataKey="gst" name="GST" stackId="a" fill="#A8C7FA" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="refunds" name="Refunds" fill="#F2B8B5" radius={[4, 4, 4, 4]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cashflow Donut Chart */}
      <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
        <div className="mb-2 px-2">
          <h3 className="text-sm font-medium text-[#E3E3E3]">Cashflow Distribution</h3>
        </div>
        <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
          ) : !hasCashflow ? (
            <EmptyState 
              icon={Wallet} 
              title="Perfectly Balanced" 
              message="Your cashflow is exactly zero. Awaiting the first capital influx. ⚖️" 
            />
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                <Pie data={cashflowData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {cashflowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '11px', color: '#E3E3E3', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}