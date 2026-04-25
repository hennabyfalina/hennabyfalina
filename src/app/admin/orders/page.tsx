// src/app/admin/orders/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/admin/OrderModal'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import StatsCard from '@/components/admin/StatsCard'
import { ShoppingBag, Clock, RefreshCw, CheckCircle2, XOctagon } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  payment_method_detail?: string
  created_at: string
  users: { name: string } | null
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [statusFilter, paymentMethodFilter, searchQuery])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (paymentMethodFilter !== 'all') params.append('payment_method', paymentMethodFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await response.json()
      setOrders(data)

      if (statusFilter === 'all' && paymentMethodFilter === 'all' && !searchQuery) {
        const currentStats = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
        data.forEach((o: Order) => {
          if (currentStats[o.status as keyof typeof currentStats] !== undefined) {
            currentStats[o.status as keyof typeof currentStats]++
          }
        })
        setStats(currentStats)
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrderUpdate = () => {
    loadOrders()
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      loadOrders() // Refresh stats and verify
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status')
      loadOrders() // Revert on error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatsCard title="Total Orders" value={Object.values(stats).reduce((a, b) => a + b, 0)} icon={<ShoppingBag className="w-5 h-5" />} color="blue" />
          <StatsCard title="Pending" value={stats.pending || 0} icon={<Clock className="w-5 h-5" />} color="orange" />
          <StatsCard title="Processing" value={stats.processing || 0} icon={<RefreshCw className="w-5 h-5" />} color="purple" />
          <StatsCard title="Delivered" value={stats.delivered || 0} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
          <StatsCard title="Cancelled" value={stats.cancelled || 0} icon={<XOctagon className="w-5 h-5" />} color="red" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search order # or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white border border-gray-200 rounded-lg text-sm"
            />
            <svg className="absolute left-4 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            title="Filter by Order Status"
            className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="cancel_requested">Cancel Requested</option>
            <option value="return_requested">Return Requested</option>
            <option value="returned">Returned</option>
          </select>
          <select 
            value={paymentMethodFilter} 
            onChange={(e) => setPaymentMethodFilter(e.target.value)} 
            title="Filter by Payment Method"
            className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Payment Methods</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Netbanking</option>
            <option value="wallet">Wallet</option>
            <option value="emi">EMI</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.users?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">₹{order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.payment_method_detail ? (
                        <span className="capitalize inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {order.payment_method_detail}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    title="Change Order Status"
                    className="text-xs font-medium bg-gray-50 border border-gray-300 text-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full py-1.5 px-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancel_requested">Cancel Req.</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="return_requested">Return Req.</option>
                    <option value="returned">Returned</option>
                  </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.payment_status} type="payment" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setModalOpen(true)
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        View  
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OrderModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedOrder(null)
        }}
        orderId={selectedOrder?.id || ''}
        orderNumber={selectedOrder?.order_number}
        onSuccess={handleOrderUpdate}
      />
    </>
  )
}