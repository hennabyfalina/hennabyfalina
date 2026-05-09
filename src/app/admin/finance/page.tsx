// src/app/admin/finance/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/StatsCard'
import AdminLoader from '@/components/admin/AdminLoader'
import { formatCurrency, formatCompactIndianCurrency, formatDate } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Wallet, IndianRupee, TrendingDown, FileText, Download, Search, Filter, ReceiptText, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import DashboardDateFilter from '@/components/admin/DashboardDateFilter'
import { useSearchParams } from 'next/navigation'
import FinanceCharts from '@/components/admin/FinanceCharts'
import FinanceLedgerTable from '@/components/admin/FinanceLedgerTable'

// 🚨 IMPORTED DRY CONSTANTS 🚨
import { FINANCE_TRANSACTION_TYPES, FINANCE_SORT_OPTIONS } from '@/lib/constants'

interface LedgerEntry {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  payment_status: string
  razorpay_payment_id: string | null
  type: 'credit' | 'debit'
  taxable_value: number
  gst_amount: number
}

const GST_RATE = 0.18 // 18% Standard GST for packaging materials

export default function AdminFinance() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth()
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  const searchParams = useSearchParams()
  const range = searchParams?.get('range') || '30d'
  const startParam = searchParams?.get('start') || ''
  const endParam = searchParams?.get('end') || ''

  const supabase = createClient()

  useEffect(() => {
    loadFinancials()
  }, [range, startParam, endParam]) // Re-fetch when date changes!

  const loadFinancials = async () => {
    setIsLoading(true)
    try {
      // 🚨 DYNAMIC DATE CALCULATION
      let startDate = new Date()
      let endDate = new Date()

      if (range === 'custom' && startParam && endParam) {
        startDate = new Date(startParam)
        endDate = new Date(endParam)
        endDate.setHours(23, 59, 59, 999)
      } else {
        let daysToFetch = 30
        if (range === '3m') daysToFetch = 90
        else if (range === '6m') daysToFetch = 180
        else if (range === '1y') daysToFetch = 365
        
        startDate.setDate(startDate.getDate() - (daysToFetch - 1))
        startDate.setHours(0, 0, 0, 0)
      }

      // Pull only finalized financial states
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, created_at, total_amount, payment_status, razorpay_payment_id')
        .in('payment_status', ['paid', 'refunded'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      const formattedLedger: LedgerEntry[] = (data || []).map(order => {
        // Reverse calculate Taxable Value and GST from Total (assuming Total is inclusive of GST)
        const taxable_value = order.total_amount / (1 + GST_RATE)
        const gst_amount = order.total_amount - taxable_value

        return {
          ...order,
          type: order.payment_status === 'refunded' ? 'debit' : 'credit',
          taxable_value,
          gst_amount,
        }
      })

      setLedger(formattedLedger)
    } catch (error) {
      showToast('Failed to load general ledger', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Date', 'Invoice/Order Ref', 'Razorpay Txn ID', 'Type', 'Taxable Value', 'GST (18%)', 'Total Amount']
      const rows = sortedLedger.map(entry => [
        new Date(entry.created_at).toISOString().split('T')[0],
        entry.order_number,
        entry.razorpay_payment_id || 'N/A',
        entry.type.toUpperCase(),
        entry.taxable_value.toFixed(2),
        entry.gst_amount.toFixed(2),
        entry.type === 'debit' ? `-${entry.total_amount}` : entry.total_amount.toString()
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      showToast('Ledger exported successfully', 'success')
    } catch (error) {
      showToast('Failed to export CSV', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // Filter & Sort Logic
  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (entry.razorpay_payment_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || entry.type === typeFilter
    return matchesSearch && matchesType
  })

  const sortedLedger = [...filteredLedger].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'amount_desc') return b.total_amount - a.total_amount
    if (sortBy === 'amount_asc') return a.total_amount - b.total_amount
    return 0
  })

  // Core Accounting Metrics
  const grossInflow = ledger.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.total_amount, 0)
  const totalRefunds = ledger.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.total_amount, 0)
  const netIncome = grossInflow - totalRefunds
  const estimatedGST = ledger.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.gst_amount, 0)

  // 🚨 CHART DATA AGGREGATION 🚨
  const cashflowData = [
    { name: 'Taxable Income', value: grossInflow - estimatedGST, color: '#93D7A4' },
    { name: 'GST Liability', value: estimatedGST, color: '#A8C7FA' },
    { name: 'Refunds (Debit)', value: totalRefunds, color: '#F2B8B5' }
  ].filter(d => d.value > 0)

  const timelineMap = new Map()
  // Sort chronologically for the timeline chart
  const ledgerChronological = [...filteredLedger].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  ledgerChronological.forEach(entry => {
    const dateStr = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!timelineMap.has(dateStr)) {
      timelineMap.set(dateStr, { date: dateStr, income: 0, gst: 0, refunds: 0 })
    }
    const data = timelineMap.get(dateStr)
    if (entry.type === 'credit') {
      data.income += entry.taxable_value
      data.gst += entry.gst_amount
    } else {
      data.refunds += entry.total_amount
    }
  })
  const timelineData = Array.from(timelineMap.values())

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Verifying permissions..." />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-[#3C1E0A] border border-[#f90400] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-900/20">
          <Lock className="w-10 h-10 text-[#f90400]" />
        </div>
        <h2 className="text-2xl font-medium text-[#E3E3E3] mb-3 tracking-tight">Restricted Zone</h2>
        <p className="text-[#8E9196] max-w-md mx-auto leading-relaxed mb-8">
          Financial auditing and ledger operations are strictly limited to Super Administrators.
        </p>
        <button onClick={() => window.history.back()} className="px-6 py-3 bg-[#1E1F20] text-[#E3E3E3] border border-[#333538] hover:border-[#A8C7FA] hover:bg-[#282A2C] rounded-full font-medium transition-colors shadow-sm cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Reconciling financial ledger..." />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* 🚨 HEADER 🚨 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight leading-tight">Financial Ledger</h1>
            <p className="text-sm text-[#C4C7C5] mt-1">Audit transactions, manage settlements, and track tax liabilities.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <DashboardDateFilter />
            <button
              onClick={exportToCSV}
              disabled={isExporting || ledger.length === 0}
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-[#1E1F20] text-[#E3E3E3] border border-[#333538] hover:border-[#A8C7FA] rounded-full hover:bg-[#282A2C] transition-colors shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {isExporting ? 'Generating CSV...' : 'Export Audit Report'}
            </button>
          </div>
        </div>

        {/* 🚨 ACCOUNTING STATS GRID 🚨 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Gross Inflow (Credit)" value={formatCompactIndianCurrency(grossInflow)} icon={<IndianRupee className="w-5 h-5 text-[#02fa40]" />} />
          <StatsCard title="Net Income" value={formatCompactIndianCurrency(netIncome)} icon={<Wallet className="w-5 h-5 text-[#A8C7FA]" />} />
          <StatsCard title="GST Liability (Est.)" value={formatCompactIndianCurrency(estimatedGST)} icon={<ReceiptText className="w-5 h-5 text-[#A8C7FA]" />} />
          <StatsCard title="Refunds (Debit)" value={formatCompactIndianCurrency(totalRefunds)} icon={<TrendingDown className="w-5 h-5 text-[#A8C7FA]" />} />
        </div>

        {/* 🚨 BUSINESS INTELLIGENCE CHARTS 🚨 */}
        <FinanceCharts timelineData={timelineData} cashflowData={cashflowData} />

        {/* 🚨 FLOATING SEARCH & FILTERS 🚨 */}
        <div className="flex flex-col md:flex-row gap-3 bg-[#1E1F20] p-3 rounded-[24px] border border-[#333538]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196] group-focus-within:text-[#A8C7FA] transition-colors" />
            <input
              type="text"
              placeholder="Search by Invoice Ref or Razorpay Txn ID..."
              title="Search transactions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-[#131314] border border-transparent text-[#E3E3E3] placeholder:text-[#8E9196] rounded-full text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E9196] hover:text-[#E3E3E3]">✕</button>}
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0 min-w-[180px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196]" />
              <select
                title="Sort transactions"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {FINANCE_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="relative shrink-0 min-w-[190px]">
              <select
                title="Filter by entry type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {FINANCE_TRANSACTION_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 🚨 ELITE AUDIT LEDGER TABLE 🚨 */}
        <FinanceLedgerTable sortedLedger={sortedLedger} />
      </div>
    </>
  )
}