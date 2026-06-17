// src/app/admin/orders/page.tsx

'use client'

import { useState, useEffect } from 'react'
import OrderModal from '@/components/admin/OrderModal'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import { formatCurrency } from '@/lib/utils'
import { ShoppingBag, Clock, RefreshCw, CheckCircle2, XOctagon, Search, Filter } from 'lucide-react'
import { ORDER_STATUS_FILTERS, PAYMENT_METHOD_FILTERS } from '@/lib/constants'
import { OrdersSkeleton } from './OrdersSkeleton';

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
  const [globalOrders, setGlobalOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const loadOrders = async (forceRefreshGlobal = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (paymentMethodFilter !== 'all') params.append('payment_method', paymentMethodFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await response.json()
      setOrders(data)

      let statsSource = data
      if (statusFilter === 'all' && paymentMethodFilter === 'all' && !searchQuery) {
        setGlobalOrders(data)
      } else {
        if (forceRefreshGlobal || globalOrders.length === 0) {
          const gRes = await fetch('/api/admin/orders')
          const gData = await gRes.json()
          setGlobalOrders(gData)
          statsSource = gData
        } else {
          statsSource = globalOrders
        }
      }
      
      const currentStats = { total: statsSource.length, pending: 0, processing: 0, delivered: 0, cancelled: 0 }
      statsSource.forEach((o: Order) => {
        if (o.status === 'pending') currentStats.pending++
        else if (['processing', 'confirmed', 'packed', 'ready_for_pickup', 'shipped'].includes(o.status)) currentStats.processing++
        else if (['delivered', 'picked_up'].includes(o.status)) currentStats.delivered++
        else if (['cancelled', 'returned', 'cancel_requested', 'return_requested'].includes(o.status)) currentStats.cancelled++
      })
      setStats(currentStats)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter, paymentMethodFilter, searchQuery])

  const handleOrderUpdate = () => {
    loadOrders(true)
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
      loadOrders(true)
    } catch (error) {
      console.error('Failed to update order status:', error)
      loadOrders(true)
    }
  }

  // Show skeleton if loading and no orders yet (initial load)
if (isLoading) {
  return <OrdersSkeleton />;
}

  return (
    <>
      <div className="flex flex-col gap-6">
        
        <div>
          <h1 className="text-[28px] font-medium admin-text-primary tracking-tight leading-tight">Orders</h1>
          <p className="text-sm admin-text-secondary mt-1">Manage, track, and update customer fulfillments.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Total Orders", value: stats.total || 0, icon: <ShoppingBag className="w-5 h-5" /> },
            { title: "Pending", value: stats.pending || 0, icon: <Clock className="w-5 h-5" /> },
            { title: "Processing", value: stats.processing || 0, icon: <RefreshCw className="w-5 h-5" /> },
            { title: "Delivered", value: stats.delivered || 0, icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
            { title: "Cancelled", value: stats.cancelled || 0, icon: <XOctagon className="w-5 h-5" /> },
          ].map((stat, idx) => (
            <div key={idx} className="admin-bg-card rounded-[24px] p-5 border border-transparent hover:admin-bg-elevated transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs font-medium admin-text-secondary">{stat.title}</h3>
                <div className="admin-text-accent">{stat.icon}</div>
              </div>
              <p className="text-3xl font-normal admin-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted group-focus-within:admin-text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 admin-bg-primary border border-transparent admin-text-primary placeholder:admin-text-muted rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-text"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0 min-w-[140px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted" />
              <select 
                value={statusFilter} 
                title="Filter by order status"
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {ORDER_STATUS_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value} className="admin-bg-card">{filter.label}</option>
                ))}
              </select>
            </div>

            <div className="relative shrink-0 min-w-[180px]">
              <select 
                value={paymentMethodFilter} 
                title="Filter by payment method"
                onChange={(e) => setPaymentMethodFilter(e.target.value)} 
                className="w-full px-5 py-3 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {PAYMENT_METHOD_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value} className="admin-bg-card">{filter.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
          {isLoading && orders.length > 0 && (
            <div className="w-full h-1 admin-bg-elevated overflow-hidden">
              <div className="h-full bg-[#A8C7FA] animate-pulse w-1/3 rounded-r-full"></div>
            </div>
          )}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px] text-left">
              <thead className="admin-bg-primary">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Order #</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-right text-xs font-medium admin-text-muted uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y admin-border">
                {orders.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center admin-text-muted font-medium">
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
                      className="hover:admin-bg-elevated transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-sm font-medium admin-text-primary group-hover:admin-text-accent transition-colors">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm admin-text-secondary line-clamp-1">{order.users?.name || 'Guest'}</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm admin-text-secondary">
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
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium admin-text-primary">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="capitalize inline-flex px-3 py-1 rounded-full text-[11px] font-bold tracking-wide admin-bg-primary admin-text-accent border admin-border">
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