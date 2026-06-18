// src/components/admin/FinanceLedgerTable.tsx

'use client'

import { FileText, Lock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// Set flag matching your main page state configuration metrics parameters
const IS_GST_SUPPORT_VISIBLE = false

export default function FinanceLedgerTable({ sortedLedger }: { sortedLedger: any[] }) {
  const { isSuperAdmin } = useAuth()

  if (!isSuperAdmin) {
    return (
      <div className="admin-bg-card rounded-[32px] border border-solid admin-border overflow-hidden select-none">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lock className="w-12 h-12 text-[#F9AB00] mb-4" />
          <p className="admin-text-primary font-medium">Transaction Ledger Restricted</p>
          <p className="admin-text-muted text-sm mt-1">Super Admin access required to view financial records</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-bg-card rounded-[32px] border border-solid admin-border overflow-hidden text-left font-sans antialiased select-none">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead className="admin-bg-primary">
            <tr>
              <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest whitespace-nowrap">Date & Time</th>
              <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest whitespace-nowrap">Invoice Ref</th>
              <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest whitespace-nowrap">Gateway Txn ID</th>
              <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest whitespace-nowrap">Entry Type</th>
              {IS_GST_SUPPORT_VISIBLE && (
                <>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest text-right whitespace-nowrap">Taxable Value</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest text-right whitespace-nowrap">GST (18%)</th>
                </>
              )}
              <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest text-right whitespace-nowrap">Net Value Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y admin-border">
            {sortedLedger.length === 0 ? (
              <tr>
                <td colSpan={IS_GST_SUPPORT_VISIBLE ? 7 : 5} className="px-6 py-16 text-center italic font-medium admin-text-muted">
                  <FileText className="w-12 h-12 admin-text-muted mx-auto mb-4" />
                  <p>No finalized financial records found.</p>
                </td>
              </tr>
            ) : (
              sortedLedger.map((entry) => (
                <tr key={entry.id} className="hover:admin-bg-elevated transition-colors group cursor-default">
                  <td className="px-6 py-5 text-sm admin-text-secondary whitespace-nowrap font-mono">{formatDate(entry.created_at)}</td>
                  <td className="px-6 py-5"><span className="font-mono admin-text-primary font-medium">{entry.order_number}</span></td>
                  <td className="px-6 py-5"><span className="font-mono admin-text-muted text-[13px] admin-bg-primary px-2 py-1 rounded-md border border-solid admin-border">{entry.razorpay_payment_id || 'EXTERNAL_SETTLEMENT'}</span></td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-solid ${
                      entry.type === 'credit' ? 'bg-[#214332]/30 text-[#93D7A4] border-[#214332]' : 'bg-[#4D2628] text-[#F2B8B5] border-[#8C1D18]'
                    }`}>
                      {entry.type === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  {IS_GST_SUPPORT_VISIBLE && (
                    <>
                      <td className="px-6 py-5 text-right font-mono text-sm admin-text-secondary">{formatCurrency(entry.taxable_value)}</td>
                      <td className="px-6 py-5 text-right font-mono text-sm admin-text-secondary">{formatCurrency(entry.gst_amount)}</td>
                    </>
                  )}
                  <td className={`px-6 py-5 text-right font-mono font-bold text-[15px] whitespace-nowrap ${entry.type === 'credit' ? 'text-[#93D7A4]' : 'text-[#F2B8B5]'}`}>
                    {entry.type === 'debit' ? '-' : ''}{formatCurrency(entry.total_amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}