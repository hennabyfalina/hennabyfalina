'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllInventoryLogs } from '@/services/inventory.service'
import { formatDate } from '@/lib/utils'

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading logs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Recent stock adjustments and system changes</p>
        </div>
        <Link
          href="/admin/inventory"
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Inventory
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Change</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Reason</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {log.products?.name || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      log.change_amount > 0 ? 'bg-green-50 text-green-700' :
                      log.change_amount < 0 ? 'bg-orange-50 text-orange-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {log.change_amount > 0 ? '+' : ''}{log.change_amount} ({log.previous_stock} ➔ {log.new_stock})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize whitespace-nowrap">
                    {log.reason}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {log.users?.name || log.users?.email || 'System Account'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p>No inventory logs found.</p>
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
