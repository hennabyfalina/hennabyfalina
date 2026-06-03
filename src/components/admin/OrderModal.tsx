// src/components/admin/OrderModal.tsx

'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from './layout/AdminConfirmModal'
import OrderStatusBadge from './OrderStatusBadge'
import AdminLoader from './AdminLoader'
import { formatCurrency, formatDate } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Package, Truck, MapPin, CreditCard, Calendar, Hash, ExternalLink, Printer, Trash2, Phone, Download } from 'lucide-react'
import InvoiceLink from '@/components/order/InvoiceLink'
import { siteConfig } from '@/config/site'
import { ORDER_STATUS_FILTERS } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
  onSuccess?: () => void
}

export default function OrderModal({ isOpen, onClose, orderId, orderNumber, onSuccess }: OrderModalProps) {
  const { isSuperAdmin } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [downloadingArtwork, setDownloadingArtwork] = useState<string | null>(null)

  const rawAvailableStatuses = ORDER_STATUS_FILTERS.filter(f => f.value !== 'all')

  const loadOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order data')
      const data = await response.json()
      setOrder(data)

      if (data.courier_name) setCourierName(data.courier_name)
      if (data.tracking_number) setTrackingNumber(data.tracking_number)
      if (data.tracking_url) setTrackingUrl(data.tracking_url)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder()
    } else {
      setOrder(null)
      setNewStatus('')
      setReason('')
      setCourierName('')
      setTrackingNumber('')
      setTrackingUrl('')
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (order) setNewStatus(order.status)
  }, [order])

  const handleInitiateUpdate = () => {
    if (newStatus === order?.status) return
    setShowStatusConfirm(true)
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
          courier_name: newStatus === 'shipped' ? courierName : undefined,
          tracking_number: newStatus === 'shipped' ? trackingNumber : undefined,
          tracking_url: newStatus === 'shipped' ? trackingUrl : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update order status')
      }

      showToast(`Order updated successfully!`, 'success')
      setShowStatusConfirm(false)
      onClose() 
      if (onSuccess) onSuccess()
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const executeDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete order permanently')
      
      showToast('Order permanently deleted', 'success')
      setShowDeleteConfirm(false)
      onClose() 
      if (onSuccess) onSuccess()
    } catch (error: any) {
      showToast(error.message || 'Failed to delete order', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSecureDownload = async (internalPath: string, action: 'view' | 'download' = 'view') => {
    setDownloadingArtwork(internalPath)
    try {
      const url = `/api/admin/artwork?path=${encodeURIComponent(internalPath)}`
      
      if (action === 'download') {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch file')
        const blob = await response.blob()
        const objectUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = internalPath.split('/').pop() || `artwork-${new Date().getTime()}`
        document.body.appendChild(a)
        a.click()
        showToast("Download Successfully. Check your device's download section.", 'success')
        window.URL.revokeObjectURL(objectUrl)
        document.body.removeChild(a)
      } else {
        showToast("Opening artwork in new tab...", 'success')
        window.open(url, '_blank')
      }
    } catch (error) {
      showToast('Failed to access artwork file', 'error')
    } finally {
      setDownloadingArtwork(null)
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Details">
        <AdminLoader message="Fetching order database..." />
      </Modal>
    )
  }

  if (error || !order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Details">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <p className="text-red-400 font-medium text-sm mb-6">{error || 'Order not found'}</p>
          <button onClick={onClose} className="px-6 py-2.5 admin-bg-elevated admin-text-primary rounded-full text-sm font-medium hover:admin-bg-hover transition-colors">
            Close Panel
          </button>
        </div>
      </Modal>
    )
  }

  const isPickup = order.shipping_method === 'pickup' || 
                   order.delivery_method === 'pickup' || 
                   order.addresses?.delivery_method === 'pickup' ||
                   (order.addresses?.address_line1 || '').toLowerCase().includes('pickup') || 
                   (order.addresses?.address || '').toLowerCase().includes('pickup');

  const address = order.addresses || {}

  const deliveryStatuses = [
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancel Requested', value: 'cancel_requested' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Return Requested', value: 'return_requested' },
    { label: 'Returned', value: 'returned' }
  ];

  const pickupStatuses = [
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Ready for Pickup', value: 'ready_for_pickup' },
    { label: 'Picked Up', value: 'picked_up' },
    { label: 'Cancel Requested', value: 'cancel_requested' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Return Requested', value: 'return_requested' },
    { label: 'Returned', value: 'returned' }
  ];

  const displayStatuses = isPickup ? pickupStatuses : deliveryStatuses;

  const isUpdateDisabled = 
    newStatus === order.status || 
    (newStatus === 'shipped' && (!courierName.trim() || !trackingNumber.trim())) ||
    (newStatus === 'cancelled' && !reason.trim())

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Order #${order.order_number}`}>
        <div className="space-y-6 max-h-[75vh] overflow-y-auto overscroll-contain pr-1 sm:pr-2 no-scrollbar admin-text-primary pb-6">
          
          {/* Order Summary Block */}
          <div className="admin-bg-primary rounded-[24px] p-5 sm:p-6 border admin-border">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-[10px] admin-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Date</p>
                <p className="text-sm font-medium admin-text-primary">
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
                </p>
              </div>
              <div>
                <p className="text-[10px] admin-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Hash className="w-3.5 h-3.5" /> Order ID</p>
                <p className="text-sm font-mono admin-text-accent">{order.order_number}</p>
              </div>
              <div>
                <p className="text-[10px] admin-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Package className="w-3.5 h-3.5" /> Total</p>
                <p className="text-base font-medium admin-text-primary">{formatCurrency(order.total_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] admin-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Truck className="w-3.5 h-3.5" /> Delivery</p>
                <p className="text-sm font-bold text-[#93D7A4] capitalize">{isPickup ? 'Store Pickup' : 'Home Delivery'}</p>
              </div>
            </div>
            
            {order.payment_status === 'paid' && (
              <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t admin-border">
                <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="customer" textLabel="Customer Tax Invoice" className="flex-1 justify-center px-4 py-2 admin-bg-elevated admin-text-primary rounded-full text-xs font-medium hover:admin-bg-hover transition-colors flex items-center gap-2 border admin-border" />
                <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="merchant" textLabel="Owner Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#3C1E0A]/40 text-[#F9AB00] rounded-full text-xs font-medium hover:bg-[#3C1E0A] transition-colors flex items-center gap-2 border border-[#4E270D]" />
              </div>
            )}
          </div>

          {/* Order Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium admin-text-primary flex items-center gap-2">
                <Package className="w-4 h-4 admin-text-accent" /> Order Items
              </h3>
              <span className="text-xs font-bold admin-text-muted admin-bg-primary px-2.5 py-1 rounded-full border admin-border">
                {order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} Items
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {order.order_items?.map((item: any, index: number) => (
                <div key={item.id} className="admin-bg-primary border admin-border rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 hover:border-[#44474A] transition-colors">
                  
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium admin-text-primary text-[15px] sm:text-base leading-tight">
                        {order.order_items.length > 1 ? `${index + 1}. ` : ''}{item.products?.name || 'Product'}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium admin-text-primary text-base">
                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="admin-bg-card px-3 py-1.5 rounded-full border admin-border">
                      <span className="admin-text-muted">Qty:</span> <span className="font-bold admin-text-primary">{item.quantity}</span>
                    </div>
                    <div className="admin-bg-card px-3 py-1.5 rounded-full border admin-border">
                      <span className="admin-text-muted">Rate:</span> <span className="font-bold admin-text-primary">{formatCurrency(item.price || 0)}</span>
                    </div>
                  </div>

                  {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                    <div className="border-t admin-border/50 pt-3 mt-1">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold admin-text-accent uppercase tracking-wider mb-1">
                            <span className="admin-text-muted">Customization Type:</span> {item.printing_type}
                          </div>
                          {item.printing_instructions && (
                            <div className="text-xs admin-text-secondary">
                              <span className="admin-text-muted">Note:</span> {item.printing_instructions}
                            </div>
                          )}
                        </div>
                        
                        {item.artwork_urls && item.artwork_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                            {item.artwork_urls.map((url: string, idx: number) => (
                              <div key={idx} className="flex flex-row items-center admin-bg-elevated border admin-border rounded-full overflow-hidden shrink-0 w-full sm:w-auto transition-colors focus-within:border-[#A8C7FA]">
                                <button 
                                  onClick={() => handleSecureDownload(url, 'view')}
                                  disabled={downloadingArtwork === url}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 hover:admin-bg-hover text-xs font-medium admin-text-primary transition-colors cursor-pointer disabled:opacity-50 flex-1 border-r admin-border"
                                >
                                  {downloadingArtwork === url ? (
                                    <><div className="w-3 h-3 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin" /> ...</>
                                  ) : (
                                    <><ExternalLink className="w-3 h-3 admin-text-accent" /> View {idx + 1}</>
                                  )}
                                </button>
                                <button 
                                  onClick={() => handleSecureDownload(url, 'download')}
                                  disabled={downloadingArtwork === url}
                                  className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 hover:admin-bg-hover text-xs font-medium text-[#93D7A4] transition-colors cursor-pointer disabled:opacity-50"
                                  title={`Download File ${idx + 1}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Address Info */}
          <div>
            <h3 className="text-sm font-medium admin-text-primary mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 admin-text-accent" /> 
              {isPickup ? 'Store Pickup Details' : 'Shipping Address'}
            </h3>
            <div className="admin-bg-primary rounded-[24px] p-5 sm:p-6 border admin-border">
              {isPickup ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] admin-text-muted uppercase tracking-widest font-bold mb-1">Store Branch</p>
                  <p className="font-medium admin-text-primary text-base">{siteConfig.name}</p>
                  <p className="text-sm admin-text-secondary leading-relaxed mt-1">
                    {siteConfig.address.line1}, {siteConfig.address.line2}<br />
                    {siteConfig.address.city} - <span className="font-bold admin-text-primary">{siteConfig.address.pincode}</span>
                  </p>
                  <div className="mt-4 pt-4 border-t admin-border">
                    <p className="text-[11px] admin-text-muted uppercase tracking-widest font-bold mb-1">Customer to pickup</p>
                    <p className="text-sm admin-text-primary">{address.name || 'N/A'}</p>
                    <a href={`tel:${address.phone}`} className="text-sm font-medium admin-text-accent flex items-center gap-1.5 hover:underline w-fit mt-1">
                      <Phone className="w-3.5 h-3.5" /> {address.phone || 'N/A'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-[11px] admin-text-muted uppercase tracking-widest font-bold">Recipient</p>
                      <p className="text-base font-bold admin-text-primary">{address.name || 'N/A'}</p>
                      <a href={`tel:${address.phone}`} className="text-sm font-medium admin-text-accent flex items-center gap-1.5 hover:underline w-fit">
                        {address.phone || 'N/A'}
                      </a>
                    </div>
                    <div className="flex-[2] space-y-1.5 border-t sm:border-t-0 sm:border-l admin-border pt-5 sm:pt-0 sm:pl-8">
                      <p className="text-[11px] admin-text-muted uppercase tracking-widest font-bold">Delivery Address</p>
                      <p className="text-sm admin-text-secondary leading-relaxed">
                        {address.address_line1 || address.address}
                        {address.address_line2 && <>, {address.address_line2}</>}
                        <br />
                        {address.city || 'N/A'} - <span className="font-bold admin-text-primary">{address.pincode || 'N/A'}</span>
                        <br />
                        {address.state || 'N/A'}, {address.country || 'India'}
                      </p>
                    </div>
                  </div>
                  {(address.landmark || address.delivery_instructions) && (
                    <div className="mt-5 pt-4 border-t admin-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {address.landmark && (
                        <div>
                          <p className="text-[10px] admin-text-muted uppercase tracking-widest mb-1">Landmark</p>
                          <p className="text-sm admin-text-primary">{address.landmark}</p>
                        </div>
                      )}
                      {address.delivery_instructions && (
                        <div>
                          <p className="text-[10px] admin-text-muted uppercase tracking-widest mb-1">Instructions</p>
                          <p className="text-sm admin-text-primary">{address.delivery_instructions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div>
             <h3 className="text-sm font-medium admin-text-primary mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 admin-text-accent" /> Payment Details
            </h3>
            <div className="admin-bg-primary rounded-[24px] p-5 sm:p-6 border admin-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm admin-text-muted">Method</span>
                <span className="text-sm font-medium admin-text-primary capitalize">Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm admin-text-muted">Status</span>
                <OrderStatusBadge status={order.payment_status} type="payment" />
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm admin-text-muted shrink-0">Txn ID</span>
                  <span className="text-[11px] font-mono admin-text-accent truncate admin-bg-card px-2 py-1 rounded-md">{order.razorpay_payment_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* ACTION ZONE: UPDATE STATUS */}
          <div className="pt-4 border-t admin-border">
            <h3 className="text-[11px] font-bold admin-text-muted uppercase tracking-widest mb-3">Workflow Action</h3>
            <div className="space-y-4 admin-bg-primary p-5 rounded-[24px] border admin-border">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm admin-text-muted">Current Status</span>
                <OrderStatusBadge status={order.status} type="order" />
              </div>
              
              <select
                value={newStatus}
                title="Select new order status"
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3.5 admin-bg-card border admin-border admin-text-primary rounded-full text-sm font-medium focus:outline-none focus:border-[#A8C7FA] transition-colors appearance-none cursor-pointer"
              >
                {displayStatuses.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {newStatus === 'shipped' && !isPickup && (
                <div className="space-y-3 admin-bg-card p-4 rounded-[20px] border admin-border">
                  <p className="text-xs font-bold admin-text-accent mb-2 uppercase tracking-wide">Dispatch Details</p>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Courier Name (e.g., Delhivery, BlueDart) *"
                    className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking Number / AWB *"
                    className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="Tracking URL (Optional)"
                    className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                </div>
              )}

              {newStatus === 'cancelled' && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Required: Reason for cancellation..."
                  rows={2}
                  className="w-full px-4 py-3 admin-bg-card border admin-border admin-text-primary placeholder:admin-text-muted rounded-[20px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors resize-none"
                />
              )}

              <button
                onClick={handleInitiateUpdate}
                disabled={isUpdateDisabled}
                className={`w-full py-3.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  isUpdateDisabled 
                    ? 'admin-bg-card admin-text-muted cursor-not-allowed border admin-border' 
                    : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] border-transparent shadow-lg shadow-blue-900/20'
                }`}
              >
                Update to {displayStatuses.find(s => s.value === newStatus)?.label || newStatus}
              </button>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="pt-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold bg-[#3C1E0A]/40 text-[#F9AB00] hover:bg-[#3C1E0A] hover:text-[#F9AB00] border border-transparent transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Order Permanently
              </button>
            </div>
          )}

        </div>
      </Modal>

      <AdminConfirmModal
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={executeUpdate}
        title="Confirm Status Update"
        description={`Are you sure you want to change the order status from ${order?.status} to ${newStatus}?`}
        confirmText="Update Status"
        isLoading={isSubmitting}
      />

      <AdminConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Delete Order Permanently?"
        description={`You are about to completely delete Order #${order?.order_number}. This removes it from the database and cannot be recovered.`}
        confirmText="Delete Order"
        isDestructive={true}
        requireMatch={order?.order_number}
        isLoading={isDeleting}
      />
    </>
  )
}