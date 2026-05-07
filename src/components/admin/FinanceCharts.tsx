// src/components/admin/FinanceCharts.tsx

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FileLineChart, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function FinanceCharts({ timelineData, cashflowData }: { timelineData: any[], cashflowData: any[] }) {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      {/* Stacked Bar Chart */}
      <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm lg:col-span-2 flex flex-col">
        <div className="mb-6 px-2">
          <h3 className="text-sm font-medium text-[#E3E3E3]">Income & Tax Timeline</h3>
          <p className="text-[11px] text-[#8E9196] uppercase tracking-widest mt-1">Daily Financial Aggregation</p>
        </div>
        <div className="h-[240px] w-full min-w-0 flex-1">
          {timelineData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#565959]">
              <FileLineChart className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">No transaction data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333538" vertical={false} />
                <XAxis dataKey="date" stroke="#565959" fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                <YAxis stroke="#565959" fontSize={11} tickLine={false} axisLine={false} width={80} tickFormatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#282A2C' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#8E9196' }} />
                <Bar dataKey="income" name="Taxable Income" stackId="a" fill="#93D7A4" radius={[0, 0, 0, 0]} />
                <Bar dataKey="gst" name="GST (18%)" stackId="a" fill="#A8C7FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="refunds" name="Refunds" fill="#F2B8B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Donut Chart */}
      <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-6 shadow-sm flex flex-col">
        <div className="mb-2 px-2">
          <h3 className="text-sm font-medium text-[#E3E3E3]">Cashflow Distribution</h3>
        </div>
        <div className="h-[220px] w-full flex-1">
          {cashflowData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#565959]">
              <Wallet className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">No cashflow data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cashflowData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                  {cashflowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#565959', strokeWidth: 1 }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#8E9196' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}