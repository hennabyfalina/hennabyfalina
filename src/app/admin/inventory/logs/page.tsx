// src/app/admin/inventory/logs/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllInventoryLogs } from '@/services/inventory.service'
import { formatDate } from '@/lib/utils'
import { History, ChevronLeft, TrendingUp, TrendingDown, Minus, User, Calendar } from 'lucide-react'
import InventoryLogsLoading from './loading'

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    loadLogs()
  }, [])

  if (isLoading) {
    return <InventoryLogsLoading />;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans antialiased text-left select-none">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/inventory" 
            className="p-2 admin-bg-card border border-solid admin-border admin-text-muted hover:admin-text-primary rounded-full transition-colors text-decoration-none flex items-center justify-center outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold admin-text-primary tracking-tight">Audit Logs</h1>
            <p className="text-sm admin-text-muted mt-1">Track every stock adjustment and system operation.</p>
          </div>
        </div>
      </div>

      <div className="admin-bg-card rounded-[32px] border border-solid admin-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="admin-bg-primary">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold admin-text-muted uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[11px] font-bold admin-text-muted uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[11px] font-bold admin-text-muted uppercase tracking-widest">Movement</th>
                <th className="px-6 py-4 text-[11px] font-bold admin-text-muted uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold admin-text-muted uppercase tracking-widest">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {logs.map((log) => {
                // Read from native change_amount parameter fallback to calculated offsets
                const deltaMovement = log.change_amount !== undefined ? log.change_amount : (log.new_stock - log.previous_stock)

                return (
                  <tr key={log.id} className="hover:admin-bg-elevated transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 admin-text-secondary">
                        <Calendar className="w-3.5 h-3.5 admin-text-muted" />
                        <span className="text-xs font-medium font-mono">{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold admin-text-primary line-clamp-1 capitalize">{log.products?.name?.toLowerCase() || 'Unknown Product'}</p>
                      <p className="text-[10px] admin-text-muted mt-0.5 font-mono uppercase tracking-wide">{log.products?.sku || 'NO-SKU'}</p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-solid ${
                          deltaMovement > 0 ? 'admin-badge-delivered border-[var(--admin-status-delivered-text)]/20' : 
                          deltaMovement < 0 ? 'admin-badge-cancelled border-[var(--admin-status-cancelled-text)]/20' : 
                          'admin-bg-elevated admin-text-secondary admin-border'
                        }`}>
                          {deltaMovement > 0 ? <TrendingUp className="w-3 h-3" /> : 
                           deltaMovement < 0 ? <TrendingDown className="w-3 h-3" /> : 
                           <Minus className="w-3 h-3" />}
                          {deltaMovement > 0 ? '+' : ''}{deltaMovement}
                        </div>
                        <span className="text-xs admin-text-muted font-mono admin-bg-primary px-2 py-1 rounded border border-solid admin-border">
                          {log.previous_stock} ➔ <span className="admin-text-primary font-bold">{log.new_stock}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm admin-text-secondary font-medium tracking-tight">
                        {log.reason ? log.reason.replace(/_/g, ' ') : 'Manual Adjustment'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 bg-[#0B57D0]/10 admin-text-accent border border-solid border-[#0B57D0]/30 px-3 py-1.5 rounded-full">
                        <User className="w-3 h-3" />
                        <span className="font-mono text-[11px] tracking-wide font-semibold">
                          {log.users?.name || log.users?.email?.split('@')[0] || 'System Admin'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center italic admin-text-muted font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <History className="w-12 h-12 admin-text-muted" />
                      <p className="text-sm">No inventory audit logs found.</p>
                    </div>
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