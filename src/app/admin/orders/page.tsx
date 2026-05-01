// src/app/admin/orders/page.tsx

'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/admin/OrderModal'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import AdminLoader from '@/components/admin/AdminLoader'
import { formatCurrency } from '@/lib/utils'
import { ShoppingBag, Clock, RefreshCw, CheckCircle2, XOctagon, Search, Filter } from 'lucide-react'
import { ORDER_STATUS_FILTERS, PAYMENT_METHOD_FILTERS } from '@/lib/constants'

interface Order {
  payment_method: string | undefined
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

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, orderId: string) => {
    e.stopPropagation()
    const newStatus = e.target.value
    try {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      loadOrders()
    } catch (error) {
      console.error('Failed to update order status:', error)
      loadOrders()
    }
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Fetching order database..." />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div>
          <h1 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight leading-tight">Orders</h1>
          <p className="text-sm text-[#C4C7C5] mt-1">Manage, track, and update customer fulfillments.</p>
        </div>

        {/* Gemini-Inspired Stats Grid [cite: 17] */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Total Orders", value: Object.values(stats).reduce((a, b) => a + b, 0), icon: <ShoppingBag className="w-5 h-5" /> },
            { title: "Pending", value: stats.pending || 0, icon: <Clock className="w-5 h-5" /> },
            { title: "Processing", value: stats.processing || 0, icon: <RefreshCw className="w-5 h-5" /> },
            { title: "Delivered", value: stats.delivered || 0, icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
            { title: "Cancelled", value: stats.cancelled || 0, icon: <XOctagon className="w-5 h-5" /> },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#1E1F20] rounded-[24px] p-5 border border-transparent hover:bg-[#282A2C] transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs font-medium text-[#C4C7C5]">{stat.title}</h3>
                <div className="text-[#A8C7FA]">{stat.icon}</div>
              </div>
              <p className="text-3xl font-normal text-[#E3E3E3]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters with Pill Geometry [cite: 17, 26] */}
        <div className="flex flex-col md:flex-row gap-3 bg-[#1E1F20] p-3 rounded-[24px] border border-[#333538]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196] group-focus-within:text-[#A8C7FA] transition-colors" />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-[#131314] border border-transparent text-[#E3E3E3] placeholder:text-[#8E9196] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-text"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0 min-w-[140px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196]" />
              <select 
                value={statusFilter} 
                title="Filter by order status"
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {ORDER_STATUS_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value} className="bg-[#1E1F20]">{filter.label}</option>
                ))}
              </select>
            </div>

            <div className="relative shrink-0 min-w-[180px]">
              <select 
                value={paymentMethodFilter} 
                title="Filter by payment method"
                onChange={(e) => setPaymentMethodFilter(e.target.value)} 
                className="w-full px-5 py-3 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {PAYMENT_METHOD_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value} className="bg-[#1E1F20]">{filter.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enterprise Orders Table [cite: 11] */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden">
          {isLoading && orders.length > 0 && (
            <div className="w-full h-1 bg-[#282A2C] overflow-hidden">
              <div className="h-full bg-[#A8C7FA] animate-pulse w-1/3 rounded-r-full"></div>
            </div>
          )}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-[#131314]">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Order #</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[#8E9196] uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333538]">
                {orders.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#8E9196] font-medium">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => {
                        setSelectedOrder(order)
                        setModalOpen(true)
                      }}
                      className="hover:bg-[#282A2C] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-sm font-medium text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-[#C4C7C5] line-clamp-1">{order.users?.name || 'Guest'}</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-[#C4C7C5]">
                        {new Intl.DateTimeFormat('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        }).format(new Date(order.created_at)).toUpperCase()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-[#E3E3E3]">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="capitalize inline-flex px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#131314] text-[#A8C7FA] border border-[#333538]">
                          Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} type="order" />
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <OrderStatusBadge status={order.payment_status} type="payment" />
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                            setModalOpen(true)
                          }}
                          className="text-sm font-medium text-[#0B57D0] hover:text-[#A8C7FA] bg-[#0B57D0]/10 hover:bg-[#0B57D0]/20 px-4 py-2 rounded-full transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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