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

// Show loader if we're still loading and have no logs yet (initial load)
if (isLoading) {
  return <InventoryLogsLoading />;
}

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/inventory" 
            className="p-2 admin-bg-card border admin-border admin-text-muted hover:admin-text-primary rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold admin-text-primary tracking-tight">Audit Logs</h1>
            <p className="text-sm admin-text-muted mt-1">Track every stock adjustment and system operation.</p>
          </div>
        </div>
      </div>

      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
                const diff = log.new_stock - log.previous_stock
                return (
                  <tr key={log.id} className="hover:admin-bg-elevated transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 admin-text-secondary">
                        <Calendar className="w-3.5 h-3.5 admin-text-muted" />
                        <span className="text-xs font-medium">{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold admin-text-primary line-clamp-1">{log.products?.name || 'Unknown Product'}</p>
                      <p className="text-[10px] admin-text-muted mt-0.5 font-mono uppercase">{log.products?.sku || 'NO-SKU'}</p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${
                          diff > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          diff < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {diff > 0 ? <TrendingUp className="w-3 h-3" /> : 
                           diff < 0 ? <TrendingDown className="w-3 h-3" /> : 
                           <Minus className="w-3 h-3" />}
                          {diff > 0 ? '+' : ''}{diff}
                        </div>
                        <span className="text-xs admin-text-muted font-mono admin-bg-primary px-2 py-1 rounded border admin-border">
                          {log.previous_stock} ➔ <span className="admin-text-primary font-bold">{log.new_stock}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm admin-text-secondary capitalize">{log.reason?.replace('_', ' ') || 'Manual Adjustment'}</span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 bg-[#0B57D0]/10 admin-text-accent border border-[#0B57D0]/30 px-3 py-1.5 rounded-full">
                        <User className="w-3 h-3" />
                        <span className="font-mono text-[11px] tracking-wide">
                          {log.users?.name || log.users?.email?.split('@')[0] || 'System Admin'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <History className="w-12 h-12 admin-text-muted" />
                      <p className="admin-text-muted font-medium text-sm">No inventory audit logs found.</p>
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