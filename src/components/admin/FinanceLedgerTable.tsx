// src/components/admin/FinanceLedgerTable.tsx

'use client'

import { FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function FinanceLedgerTable({ sortedLedger }: { sortedLedger: any[] }) {
  return (
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
                  <td className="px-6 py-5 text-sm text-[#C4C7C5] whitespace-nowrap">{formatDate(entry.created_at)}</td>
                  <td className="px-6 py-5"><span className="font-mono text-[#E3E3E3] font-medium">{entry.order_number}</span></td>
                  <td className="px-6 py-5"><span className="font-mono text-[#8E9196] text-[13px] bg-[#131314] px-2 py-1 rounded-md border border-[#333538]">{entry.razorpay_payment_id || 'EXTERNAL_SETTLEMENT'}</span></td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                      entry.type === 'credit' ? 'bg-[#214332]/30 text-[#93D7A4] border-[#214332]' : 'bg-[#4D2628] text-[#F2B8B5] border-[#8C1D18]'
                    }`}>
                      {entry.type === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-sm text-[#C4C7C5]">{formatCurrency(entry.taxable_value)}</td>
                  <td className="px-6 py-5 text-right font-mono text-sm text-[#C4C7C5]">{formatCurrency(entry.gst_amount)}</td>
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
  )
}