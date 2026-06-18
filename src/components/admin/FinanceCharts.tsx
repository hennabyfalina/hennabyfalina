// src/components/admin/FinanceCharts.tsx

'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FileLineChart, Wallet, Lock } from 'lucide-react'
import { formatCurrency, formatCompactIndianCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// Set visibility match configurations
const IS_GST_SUPPORT_VISIBLE = false

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="admin-bg-primary border border-solid admin-border p-4 rounded-2xl shadow-2xl text-left select-none">
        <p className="text-[11px] font-bold admin-text-muted uppercase tracking-widest mb-2">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium flex justify-between gap-4 font-mono" style={{ color: entry.color || entry.payload.color }}>
            <span className="font-sans">{entry.name}:</span>
            <span>{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

const EmptyState = ({ icon: Icon, title, message }: any) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500 select-none">
    <div className="w-14 h-14 admin-bg-primary border border-solid admin-border rounded-full flex items-center justify-center mb-4 shadow-inner">
      <Icon className="w-6 h-6 admin-text-muted" />
    </div>
    <h4 className="text-[15px] font-bold admin-text-primary mb-1.5 tracking-tight">{title}</h4>
    <p className="text-sm admin-text-muted max-w-[240px] leading-relaxed">{message}</p>
  </div>
)

export default function FinanceCharts({ timelineData, cashflowData }: { timelineData: any[], cashflowData: any[] }) {
  const { isSuperAdmin } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  if (!isSuperAdmin) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full select-none">
        <div className="xl:col-span-2 admin-bg-card border border-solid admin-border rounded-[32px] p-12 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Lock className="w-12 h-12 text-[#F9AB00] mb-4" />
          <p className="admin-text-primary font-medium text-center">Financial Charts Restricted</p>
          <p className="admin-text-muted text-sm text-center mt-1">Super Admin access required</p>
        </div>
        <div className="admin-bg-card border border-solid admin-border rounded-[32px] p-12 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Lock className="w-12 h-12 text-[#F9AB00] mb-4" />
          <p className="admin-text-primary font-medium text-center">Cashflow Distribution Restricted</p>
          <p className="admin-text-muted text-sm text-center mt-1">Super Admin access required</p>
        </div>
      </div>
    )
  }

  const hasTimeline = timelineData?.length > 0 && timelineData.some(d => d.income > 0 || d.gst > 0 || d.refunds > 0)
  const hasCashflow = cashflowData?.length > 0 && cashflowData.some(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full font-sans text-left select-none antialiased">
      
      <div className="xl:col-span-2 admin-bg-card border border-solid admin-border rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
        <div className="mb-2 px-2">
          <h3 className="text-sm font-medium admin-text-primary">Revenue Timeline Trend</h3>
        </div>
        <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-solid border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
          ) : !hasTimeline ? (
            <EmptyState 
              icon={FileLineChart} 
              title="Pristine Ledger" 
              message="No revenue or payouts recorded across this date interval." 
            />
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="var(--admin-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactIndianCurrency} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.04)'}} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '15px', fontSize: '11px', color: 'var(--admin-text-primary)' }} />
                
                {/* 🏛️ CONDITIONAL GRAPH RENDERING SEGMENTATION */}
                <Bar dataKey="income" name={IS_GST_SUPPORT_VISIBLE ? "Taxable Income" : "Gross Revenue Inflow"} stackId="a" fill="#93D7A4" radius={IS_GST_SUPPORT_VISIBLE ? [0, 0, 4, 4] : [4, 4, 4, 4]} maxBarSize={32} />
                {IS_GST_SUPPORT_VISIBLE && (
                  <Bar dataKey="gst" name="GST Liability" stackId="a" fill="#A8C7FA" radius={[4, 4, 0, 0]} maxBarSize={32} />
                )}
                <Bar dataKey="refunds" name="Refund Write-offs" fill="#F2B8B5" radius={[4, 4, 4, 4]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="admin-bg-card border border-solid admin-border rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col min-w-0">
        <div className="mb-2 px-2">
          <h3 className="text-sm font-medium admin-text-primary">Cashflow Allocation</h3>
        </div>
        <div className="h-[250px] sm:h-[320px] min-h-[250px] sm:min-h-[320px] w-full flex-1 mt-4 min-w-0">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-solid border-[#A8C7FA] border-t-transparent rounded-full animate-spin"></div></div>
          ) : !hasCashflow ? (
            <EmptyState 
              icon={Wallet} 
              title="Perfectly Balanced" 
              message="Your cashflow metric balance is currently zero." 
            />
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                <Pie data={cashflowData} cx="50%" cy="40%" innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value">
                  {cashflowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '11px', color: 'var(--admin-text-primary)', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}