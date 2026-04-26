// src/app/admin/orders/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import OrderModal from '@/components/admin/OrderModal'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setOrderId(id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order')
      const data = await response.json()
      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderUpdate = () => {
    loadOrder()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Order <span className="text-gray-500">#{order.order_number}</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Placed on <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span>
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{item.products?.name || 'Product'}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} × {formatCurrency(item.price || 0)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency((item.price || 0) * (item.quantity || 0))}
                    </p>
                  </div>
                ))}
                {(!order.order_items || order.order_items.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No items found</p>
                )}
              </div>

              <div className="pt-4 space-y-2 border-t border-gray-100 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.total_amount - (order.shipping_cost || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {order.shipping_cost ? formatCurrency(order.shipping_cost) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-2">{order.addresses?.name || 'N/A'}</p>
                <p>{order.addresses?.phone || 'N/A'}</p>
                <p>{order.addresses?.address || 'N/A'}</p>
                <p>{order.addresses?.city || 'N/A'}, {order.addresses?.state || 'N/A'} {order.addresses?.pincode || 'N/A'}</p>
                <p>{order.addresses?.country || 'India'}</p>
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Status:</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                  </span>
                </div>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="w-full py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="text-gray-900 capitalize">
                    {order.payment_method_detail || order.payment_method || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <OrderStatusBadge status={order.payment_status} type="payment" />
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="text-gray-900 text-xs font-mono truncate max-w-[150px]">
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}
                {order.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At:</span>
                    <span className="text-gray-900 text-sm">
                      {new Date(order.paid_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {order.payment_failed_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600 font-medium">Failed Reason:</p>
                    <p className="text-xs text-red-700 mt-1">{order.payment_failed_reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.users?.name || 'N/A'}</p>
                <p>{order.users?.email || 'N/A'}</p>
                <p>{order.users?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Modal */}
      <OrderModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        onSuccess={handleOrderUpdate}
      />
    </>
  )
}