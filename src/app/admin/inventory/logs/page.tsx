// src/app/admin/inventory/logs/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllInventoryLogs } from '@/services/inventory.service'
import { formatDate } from '@/lib/utils'
import AdminLoader from '@/components/admin/AdminLoader'
import { History, ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const data = await getAllInventoryLogs(100)
      setLogs(data)
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Fetching audit logs..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* 🚨 HEADER 🚨 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/inventory" 
            className="p-2 hover:bg-[#282A2C] rounded-full text-[#C4C7C5] transition-colors cursor-pointer" 
            title="Back to Inventory"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight leading-tight flex items-center gap-3">
              Inventory Logs
            </h1>
            <p className="text-sm text-[#C4C7C5] mt-1">Audit trail for all manual stock adjustments and system changes.</p>
          </div>
        </div>
        
        <div className="bg-[#131314] border border-[#333538] px-4 py-2 rounded-full flex items-center gap-2">
          <History className="w-4 h-4 text-[#A8C7FA]" />
          <span className="text-xs font-bold text-[#A8C7FA] uppercase tracking-widest">Last 100 Records</span>
        </div>
      </div>

      {/* 🚨 ELITE AUDIT LEDGER TABLE 🚨 */}
      <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#131314]">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Target Product</th>
                <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Delta / Change</th>
                <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap">Reason</th>
                <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest whitespace-nowrap text-right">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333538]">
              {logs.map((log) => {
                const isPositive = log.change_amount > 0
                const isNegative = log.change_amount < 0
                const isNeutral = log.change_amount === 0

                return (
                  <tr key={log.id} className="hover:bg-[#282A2C] transition-colors group cursor-default">
                    <td className="px-6 py-5 text-sm text-[#C4C7C5] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-5 text-[15px] font-medium text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors">
                      {log.products?.name || 'Deleted / Unknown Product'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap flex items-center gap-3">
                      {/* Badge Delta */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest border ${
                        isPositive ? 'bg-[#214332]/30 text-[#93D7A4] border-[#214332]' :
                        isNegative ? 'bg-[#3C1E0A] text-[#F9AB00] border-[#4E270D]' :
                        'bg-[#282A2C] text-[#C4C7C5] border-[#333538]'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{log.change_amount}
                      </span>
                      
                      {/* Before -> After Trail */}
                      <span className="text-xs text-[#8E9196] font-mono tracking-wide bg-[#131314] px-2.5 py-1 rounded-md border border-[#333538]">
                        {log.previous_stock} ➔ <span className="text-[#E3E3E3] font-bold">{log.new_stock}</span>
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#E3E3E3] capitalize whitespace-nowrap">
                      {log.reason || 'Manual Adjustment'}
                    </td>
                    <td className="px-6 py-5 text-sm text-right whitespace-nowrap">
                      <span className="bg-[#0B57D0]/10 text-[#A8C7FA] border border-[#0B57D0]/30 px-3 py-1 rounded-full font-mono text-[11px] tracking-wide">
                        {log.users?.name || log.users?.email || 'System Operation'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <History className="w-12 h-12 text-[#333538] mx-auto mb-4" />
                    <p className="text-[#8E9196] font-medium">No inventory audit logs found in the database.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}