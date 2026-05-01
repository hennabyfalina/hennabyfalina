// src/app/admin/finance/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/StatsCard'
import AdminLoader from '@/components/admin/AdminLoader'
import { formatCurrency, formatDate } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Wallet, IndianRupee, TrendingDown, FileText, Download, Search, Filter, ReceiptText } from 'lucide-react'

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
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  const supabase = createClient()

  useEffect(() => {
    loadFinancials()
  }, [])

  const loadFinancials = async () => {
    setIsLoading(true)
    try {
      // Pull only finalized financial states
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, created_at, total_amount, payment_status, razorpay_payment_id')
        .in('payment_status', ['paid', 'refunded'])

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

  if (isLoading) {
    return <AdminLoader message="Reconciling financial ledger..." />
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
          <button
            onClick={exportToCSV}
            disabled={isExporting || ledger.length === 0}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-[#1E1F20] text-[#E3E3E3] border border-[#333538] hover:border-[#A8C7FA] rounded-full hover:bg-[#282A2C] transition-colors shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isExporting ? 'Generating CSV...' : 'Export Audit Report'}
          </button>
        </div>

        {/* 🚨 ACCOUNTING STATS GRID 🚨 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Gross Inflow (Credit)" value={formatCurrency(grossInflow)} icon={<IndianRupee className="w-5 h-5 text-[#93D7A4]" />} />
          <StatsCard title="Net Income" value={formatCurrency(netIncome)} icon={<Wallet className="w-5 h-5 text-[#A8C7FA]" />} />
          <StatsCard title="GST Liability (Est.)" value={formatCurrency(estimatedGST)} icon={<ReceiptText className="w-5 h-5 text-[#C4C7C5]" />} />
          <StatsCard title="Refunds (Debit)" value={formatCurrency(totalRefunds)} icon={<TrendingDown className="w-5 h-5 text-[#F2B8B5]" />} />
        </div>

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
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-[#131314]">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Date & Time</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Invoice Ref</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Gateway Txn ID</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Entry Type</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest text-right whitespace-nowrap">Taxable Value</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest text-right whitespace-nowrap">GST (18%)</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest text-right whitespace-nowrap">Gross Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333538]">
                {sortedLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <FileText className="w-12 h-12 text-[#333538] mx-auto mb-4" />
                      <p className="text-[#8E9196] font-medium">No finalized financial records found.</p>
                    </td>
                  </tr>
                ) : (
                  sortedLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#282A2C] transition-colors group cursor-default">
                      <td className="px-6 py-5 text-sm text-[#C4C7C5] whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-[#E3E3E3] font-medium">{entry.order_number}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-[#8E9196] text-[13px] bg-[#131314] px-2 py-1 rounded-md border border-[#333538]">
                          {entry.razorpay_payment_id || 'EXTERNAL_SETTLEMENT'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                          entry.type === 'credit' ? 'bg-[#214332]/30 text-[#93D7A4] border-[#214332]' : 'bg-[#4D2628] text-[#F2B8B5] border-[#8C1D18]'
                        }`}>
                          {entry.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-sm text-[#C4C7C5]">
                        {formatCurrency(entry.taxable_value)}
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-sm text-[#C4C7C5]">
                        {formatCurrency(entry.gst_amount)}
                      </td>
                      <td className={`px-6 py-5 text-right font-mono font-bold text-[15px] ${entry.type === 'credit' ? 'text-[#93D7A4]' : 'text-[#F2B8B5]'}`}>
                        {entry.type === 'debit' ? '-' : ''}{formatCurrency(entry.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}