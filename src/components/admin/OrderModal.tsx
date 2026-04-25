'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import OrderStatusBadge from './OrderStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Package, Truck, MapPin, CreditCard, User, Calendar, Hash, IndianRupee } from 'lucide-react'
import { siteConfig } from '@/config/site'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
  onSuccess?: () => void
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
]

export default function OrderModal({ isOpen, onClose, orderId, orderNumber, onSuccess }: OrderModalProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder()
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (order) {
      setNewStatus(order.status)
    }
  }, [order])

  const loadOrder = async () => {
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

  const handleUpdateStatus = () => {
    if (newStatus === order?.status) {
      showToast('No change selected', 'info')
      return
    }
    setShowConfirm(true)
  }

  const executeUpdate = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: newStatus === 'cancelled' ? reason : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update order status')
      }

      showToast(`Order status updated to ${statusOptions.find(s => s.value === newStatus)?.label}`, 'success')
      setShowConfirm(false)
      loadOrder()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Details">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full" />
        </div>
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Details">
        <div className="text-red-600 text-center py-8">{error}</div>
      </Modal>
    )
  }

  if (!order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Details">
        <div className="text-center py-8 text-gray-500">Order not found</div>
      </Modal>
    )
  }

  const isPickup = order.shipping_method === 'pickup'
  const address = order.addresses || {}

  if (showConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Confirm Status Change">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium text-gray-900">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === order.status)?.color}`}>
                {statusOptions.find(s => s.value === order.status)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === newStatus)?.color}`}>
                {statusOptions.find(s => s.value === newStatus)?.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Are you sure you want to update this order status?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={executeUpdate}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Update'}
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order #${order.order_number}`}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* Order Summary Header */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Order Date
              </p>
              <p className="text-sm font-medium">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Order ID
              </p>
              <p className="text-sm font-mono text-gray-600">{order.order_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Total Amount
              </p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Delivery Method
              </p>
              <p className="text-sm font-medium capitalize">{isPickup ? 'Store Pickup' : 'Home Delivery'}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order Items
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Product</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-600">Qty</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Price</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.order_items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{item.products?.name || 'Product'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹{item.price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-600">Subtotal:</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(order.total_amount - (order.shipping_cost || 0))}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium text-gray-600">Shipping:</td>
                  <td className="px-4 py-2 text-right">
                    {order.shipping_cost ? formatCurrency(order.shipping_cost) : <span className="text-green-600">Free</span>}
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-2 text-right font-bold text-gray-900">Total:</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Shipping / Pickup Address */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {isPickup ? 'Store Information' : 'Shipping Address'}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {isPickup ? (
              <div>
                <p className="font-medium text-gray-900 mb-2">{siteConfig.name}</p>
                <p className="text-sm text-gray-600">{siteConfig.address.line1}</p>
                <p className="text-sm text-gray-600">{siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.country} - {siteConfig.address.pincode}</p>
                <p className="text-sm text-gray-600">Hours: {siteConfig.business.workingHours}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900">{address.name || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-1">{address.phone || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-2">{address.address_line1 || address.address || 'N/A'}</p>
                {address.address_line2 && <p className="text-sm text-gray-600">{address.address_line2}</p>}
                <p className="text-sm text-gray-600">
                  {address.city || 'N/A'}, {address.state || 'N/A'} {address.pincode || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">{address.country || 'India'}</p>
                {address.landmark && <p className="text-sm text-gray-500 mt-2">Landmark: {address.landmark}</p>}
                {address.delivery_instructions && (
                  <p className="text-sm text-gray-500 mt-2">Instructions: {address.delivery_instructions}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Information
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Method:</span>
              <span className="text-sm font-medium capitalize">
                {order.payment_method_detail || order.payment_method || 'Razorpay'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <OrderStatusBadge status={order.payment_status} type="payment" />
            </div>
            {order.razorpay_payment_id && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transaction ID:</span>
                <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">
                  {order.razorpay_payment_id}
                </span>
              </div>
            )}
            {order.paid_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paid On:</span>
                <span className="text-sm text-gray-700">{new Date(order.paid_at).toLocaleString()}</span>
              </div>
            )}
            {order.payment_failed_reason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Failed Reason:</p>
                <p className="text-xs text-red-700 mt-1">{order.payment_failed_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Information
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="font-medium text-gray-900">{order.users?.name || 'N/A'}</p>
            <p className="text-sm text-gray-600 mt-1">Email: {order.users?.email || 'N/A'}</p>
            <p className="text-sm text-gray-600">Phone: {order.users?.phone || 'N/A'}</p>
            {isPickup && (
      <p className="text-sm text-gray-600">Pincode: {address.pincode || 'N/A'}</p>
    )}
          </div>
        </div>

        {/* Order Status Update */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Order Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOptions.find(s => s.value === order.status)?.color}`}>
                {statusOptions.find(s => s.value === order.status)?.label}
              </span>
            </div>
            
            <select
              value={newStatus}
              title="Select new order status"
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {newStatus === 'cancelled' && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
            )}

            <button
              onClick={handleUpdateStatus}
              disabled={newStatus === order.status}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                newStatus === order.status
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Update Status
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}