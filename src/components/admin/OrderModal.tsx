// src/components/admin/OrderModal.tsx

'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from './layout/AdminConfirmModal'
import OrderStatusBadge from './OrderStatusBadge'
import AdminLoader from './AdminLoader'
import { formatCurrency, formatDate } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Package, Truck, MapPin, CreditCard, Calendar, Hash, ExternalLink, Printer, Trash2, Phone } from 'lucide-react'
import InvoiceLink from '@/components/order/InvoiceLink'
import { siteConfig } from '@/config/site'
import { ORDER_STATUS_FILTERS } from '@/lib/constants'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
  onSuccess?: () => void
}

export default function OrderModal({ isOpen, onClose, orderId, orderNumber, onSuccess }: OrderModalProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Action States
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  
  // 🚨 Tracking States 🚨
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modal States
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [downloadingArtwork, setDownloadingArtwork] = useState<string | null>(null)

  const rawAvailableStatuses = ORDER_STATUS_FILTERS.filter(f => f.value !== 'all')

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrder()
    } else {
      // Reset states when closed
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

  const loadOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order data')
      const data = await response.json()
      setOrder(data)

      // Load existing tracking info if it exists
      if (data.courier_name) setCourierName(data.courier_name)
      if (data.tracking_number) setTrackingNumber(data.tracking_number)
      if (data.tracking_url) setTrackingUrl(data.tracking_url)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---

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

  const handleSecureDownload = async (internalPath: string) => {
    setDownloadingArtwork(internalPath)
    try {
      const url = `/api/admin/artwork?path=${encodeURIComponent(internalPath)}`
      window.open(url, '_blank')
    } catch (error) {
      showToast('Failed to access artwork file', 'error')
    } finally {
      setDownloadingArtwork(null)
    }
  }

  // --- RENDERERS ---

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
          <button onClick={onClose} className="px-6 py-2.5 bg-[#282A2C] text-[#E3E3E3] rounded-full text-sm font-medium hover:bg-[#333538] transition-colors">
            Close Panel
          </button>
        </div>
      </Modal>
    )
  }

  // 🚨 SMART PICKUP DETECTION
  const isPickup = order.shipping_method === 'pickup' || 
                   order.delivery_method === 'pickup' || 
                   order.addresses?.delivery_method === 'pickup' ||
                   (order.addresses?.address_line1 || '').toLowerCase().includes('pickup') || 
                   (order.addresses?.address || '').toLowerCase().includes('pickup');

  const address = order.addresses || {}

// 🚨 SMART WORKFLOW DEFINITIONS 
  // Explicitly define the two distinct lifecycles for your B2B operations
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

  // Automatically swap the dropdown options based on the order type
  const displayStatuses = isPickup ? pickupStatuses : deliveryStatuses;

  // Validation: Disable the update button if required tracking fields are empty
  const isUpdateDisabled = 
    newStatus === order.status || 
    (newStatus === 'shipped' && (!courierName.trim() || !trackingNumber.trim())) ||
    (newStatus === 'cancelled' && !reason.trim())

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Order #${order.order_number}`}>
        <div className="space-y-6 max-h-[75vh] overflow-y-auto overscroll-contain pr-1 sm:pr-2 no-scrollbar text-[#E3E3E3] pb-6">
          
          {/* Order Summary Block */}
          <div className="bg-[#131314] rounded-[24px] p-5 sm:p-6 border border-[#333538]">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-[10px] text-[#8E9196] uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Date</p>
                <p className="text-sm font-medium text-[#E3E3E3]">
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
                <p className="text-[10px] text-[#8E9196] uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Hash className="w-3.5 h-3.5" /> Order ID</p>
                <p className="text-sm font-mono text-[#A8C7FA]">{order.order_number}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8E9196] uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Package className="w-3.5 h-3.5" /> Total</p>
                <p className="text-base font-medium text-[#E3E3E3]">{formatCurrency(order.total_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8E9196] uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Truck className="w-3.5 h-3.5" /> Delivery</p>
                <p className="text-sm font-bold text-[#93D7A4] capitalize">{isPickup ? 'Store Pickup' : 'Home Delivery'}</p>
              </div>
            </div>
            
            {order.payment_status === 'paid' && (
              <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-[#333538]">
                <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="customer" textLabel="Customer Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#282A2C] text-[#E3E3E3] rounded-full text-xs font-medium hover:bg-[#333538] transition-colors flex items-center gap-2 border border-[#44474A]" />
                <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="merchant" textLabel="Owner Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#3C1E0A]/40 text-[#F9AB00] rounded-full text-xs font-medium hover:bg-[#3C1E0A] transition-colors flex items-center gap-2 border border-[#4E270D]" />
              </div>
            )}
          </div>

          {/* Order Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-[#E3E3E3] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#A8C7FA]" /> Order Items
              </h3>
              <span className="text-xs font-bold text-[#8E9196] bg-[#131314] px-2.5 py-1 rounded-full border border-[#333538]">
                {order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} Items
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="bg-[#131314] border border-[#333538] rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 hover:border-[#44474A] transition-colors">
                  
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#E3E3E3] text-[15px] sm:text-base leading-tight">
                        {item.products?.name || 'Product'}
                      </h4>
                      {item.is_bulk_pricing && (
                        <span className="mt-2 inline-block px-2 py-0.5 bg-[#214332]/40 text-[#93D7A4] rounded text-[9px] font-bold tracking-widest">
                          WHOLESALE RATE
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium text-[#E3E3E3] text-base">
                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-[#1E1F20] px-3 py-1.5 rounded-full border border-[#333538]">
                      <span className="text-[#8E9196]">Qty:</span> <span className="font-bold text-[#E3E3E3]">{item.quantity}</span>
                    </div>
                    <div className="bg-[#1E1F20] px-3 py-1.5 rounded-full border border-[#333538]">
                      <span className="text-[#8E9196]">Rate:</span> <span className="font-bold text-[#E3E3E3]">{formatCurrency(item.price || 0)}</span>
                    </div>
                  </div>

                  {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                    <div className="border-t border-[#333538]/50 pt-3 mt-1">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A8C7FA] uppercase tracking-wider mb-1">
                            <Printer className="w-3.5 h-3.5" /> {item.printing_type}
                          </div>
                          {item.printing_instructions && (
                            <div className="text-xs text-[#C4C7C5]">
                              <span className="text-[#8E9196]">Note:</span> {item.printing_instructions}
                            </div>
                          )}
                        </div>
                        
                        {item.artwork_urls && item.artwork_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                            {item.artwork_urls.map((url: string, idx: number) => (
                              <button 
                                key={idx}
                                onClick={() => handleSecureDownload(url)}
                                disabled={downloadingArtwork === url}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 bg-[#282A2C] hover:bg-[#333538] border border-[#44474A] text-xs font-medium text-[#E3E3E3] rounded-full transition-colors cursor-pointer disabled:opacity-50 shrink-0 w-full sm:w-auto"
                              >
                                {downloadingArtwork === url ? (
                                  <><div className="w-3 h-3 border-2 border-[#A8C7FA] border-t-transparent rounded-full animate-spin" /> Loading...</>
                                ) : (
                                  <><ExternalLink className="w-3.5 h-3.5 text-[#A8C7FA]" /> View File {idx + 1}</>
                                )}
                              </button>
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
            <h3 className="text-sm font-medium text-[#E3E3E3] mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#A8C7FA]" /> 
              {isPickup ? 'Store Pickup Details' : 'Shipping Address'}
            </h3>
            <div className="bg-[#131314] rounded-[24px] p-5 sm:p-6 border border-[#333538]">
              {isPickup ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold mb-1">Store Branch</p>
                  <p className="font-medium text-[#E3E3E3] text-base">{siteConfig.name}</p>
                  <p className="text-sm text-[#C4C7C5] leading-relaxed mt-1">
                    {siteConfig.address.line1}, {siteConfig.address.line2}<br />
                    {siteConfig.address.city} - <span className="font-bold text-[#E3E3E3]">{siteConfig.address.pincode}</span>
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#333538]">
                    <p className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold mb-1">Customer to pickup</p>
                    <p className="text-sm text-[#E3E3E3]">{address.name || 'N/A'}</p>
                    <a href={`tel:${address.phone}`} className="text-sm font-medium text-[#A8C7FA] flex items-center gap-1.5 hover:underline w-fit mt-1">
                      <Phone className="w-3.5 h-3.5" /> {address.phone || 'N/A'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold">Recipient</p>
                      <p className="text-base font-bold text-[#E3E3E3]">{address.name || 'N/A'}</p>
                      <a href={`tel:${address.phone}`} className="text-sm font-medium text-[#A8C7FA] flex items-center gap-1.5 hover:underline w-fit">
                        <Phone className="w-3.5 h-3.5" /> {address.phone || 'N/A'}
                      </a>
                    </div>
                    <div className="flex-[2] space-y-1.5 border-t sm:border-t-0 sm:border-l border-[#333538] pt-5 sm:pt-0 sm:pl-8">
                      <p className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold">Delivery Address</p>
                      <p className="text-sm text-[#C4C7C5] leading-relaxed">
                        {address.address_line1 || address.address}
                        {address.address_line2 && <>, {address.address_line2}</>}
                        <br />
                        {address.city || 'N/A'} - <span className="font-bold text-[#E3E3E3]">{address.pincode || 'N/A'}</span>
                        <br />
                        {address.state || 'N/A'}, {address.country || 'India'}
                      </p>
                    </div>
                  </div>
                  {(address.landmark || address.delivery_instructions) && (
                    <div className="mt-5 pt-4 border-t border-[#333538] grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {address.landmark && (
                        <div>
                          <p className="text-[10px] text-[#8E9196] uppercase tracking-widest mb-1">Landmark</p>
                          <p className="text-sm text-[#E3E3E3]">{address.landmark}</p>
                        </div>
                      )}
                      {address.delivery_instructions && (
                        <div>
                          <p className="text-[10px] text-[#8E9196] uppercase tracking-widest mb-1">Instructions</p>
                          <p className="text-sm text-[#E3E3E3]">{address.delivery_instructions}</p>
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
             <h3 className="text-sm font-medium text-[#E3E3E3] mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#A8C7FA]" /> Payment Details
            </h3>
            <div className="bg-[#131314] rounded-[24px] p-5 sm:p-6 border border-[#333538] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#8E9196]">Method</span>
                <span className="text-sm font-medium text-[#E3E3E3] capitalize">Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#8E9196]">Status</span>
                <OrderStatusBadge status={order.payment_status} type="payment" />
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm text-[#8E9196] shrink-0">Txn ID</span>
                  <span className="text-[11px] font-mono text-[#A8C7FA] truncate bg-[#1E1F20] px-2 py-1 rounded-md">{order.razorpay_payment_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* 🚨 ACTION ZONE: UPDATE STATUS 🚨 */}
          <div className="pt-4 border-t border-[#333538]">
            <h3 className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest mb-3">Workflow Action</h3>
            <div className="space-y-4 bg-[#131314] p-5 rounded-[24px] border border-[#333538]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm text-[#8E9196]">Current Status</span>
                <OrderStatusBadge status={order.status} type="order" />
              </div>
              
              {/* 🚨 SMART STATUS DROPDOWN (Filters based on isPickup) 🚨 */}
              <select
                value={newStatus}
                title="Select new order status"
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1E1F20] border border-[#44474A] text-[#E3E3E3] rounded-full text-sm font-medium focus:outline-none focus:border-[#A8C7FA] transition-colors appearance-none cursor-pointer"
              >
                {displayStatuses.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {newStatus === 'shipped' && !isPickup && (
                <div className="space-y-3 bg-[#1E1F20] p-4 rounded-[20px] border border-[#44474A]">
                  <p className="text-xs font-bold text-[#A8C7FA] mb-2 uppercase tracking-wide">Dispatch Details</p>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Courier Name (e.g., Delhivery, BlueDart) *"
                    className="w-full px-4 py-3 bg-[#131314] border border-[#333538] text-[#E3E3E3] placeholder:text-[#8E9196] rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking Number / AWB *"
                    className="w-full px-4 py-3 bg-[#131314] border border-[#333538] text-[#E3E3E3] placeholder:text-[#8E9196] rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="Tracking URL (Optional)"
                    className="w-full px-4 py-3 bg-[#131314] border border-[#333538] text-[#E3E3E3] placeholder:text-[#8E9196] rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                </div>
              )}

              {newStatus === 'cancelled' && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Required: Reason for cancellation..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#1E1F20] border border-[#44474A] text-[#E3E3E3] placeholder:text-[#8E9196] rounded-[20px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors resize-none"
                />
              )}

              <button
                onClick={handleInitiateUpdate}
                disabled={isUpdateDisabled}
                className={`w-full py-3.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  isUpdateDisabled 
                    ? 'bg-[#1E1F20] text-[#8E9196] cursor-not-allowed border border-[#333538]' 
                    : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] border-transparent shadow-lg shadow-blue-900/20'
                }`}
              >
                Update to {displayStatuses.find(s => s.value === newStatus)?.label || newStatus}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold bg-[#3C1E0A]/40 text-[#F9AB00] hover:bg-[#3C1E0A] hover:text-[#F9AB00] border border-transparent transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete Order Permanently
            </button>
          </div>

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