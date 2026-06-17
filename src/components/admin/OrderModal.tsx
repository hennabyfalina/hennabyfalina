// src/components/admin/OrderModal.tsx

'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from './layout/AdminConfirmModal'
import OrderStatusBadge from './OrderStatusBadge'
import AdminLoader from './AdminLoader'
import { formatCurrency } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Package, Truck, MapPin, CreditCard, Calendar, Hash, Trash2, Phone, MessageSquare, Copy, Check, Tag, Sliders } from 'lucide-react'
import InvoiceLink from '@/components/order/InvoiceLink'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/hooks/useAuth'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
  onSuccess?: () => void
}

const CopyButton = ({ text, id, copiedId, onClick }: { text: string, id: string, copiedId: string | null, onClick: (text: string, id: string) => void }) => (
  <button type="button" onClick={() => onClick(text, id)} className="p-1.5 hover:admin-bg-elevated rounded-md transition-colors admin-text-muted hover:admin-text-accent cursor-pointer shrink-0 border-none bg-transparent outline-none">
    {copiedId === id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
  </button>
)

export default function OrderModal({ isOpen, onClose, orderId, onSuccess }: OrderModalProps) {
  const { isSuperAdmin } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order data')
      const data = await response.json()

      // 🔒 BULLETPROOF ARRAY NORMALIZATION: Fixes the "N/A" bug caused by Supabase returning arrays
      const addrSource = data.address || data.addresses;
      const normalizedAddress = Array.isArray(addrSource) ? addrSource[0] : addrSource;

      const usrSource = data.user || data.users;
      const normalizedUser = Array.isArray(usrSource) ? usrSource[0] : usrSource;

      const normalizedData = {
        ...data,
        addresses: normalizedAddress || {},
        users: normalizedUser || null,
        order_items: (data.order_items || []).map((item: any) => ({
          ...item,
          products: Array.isArray(item.product) ? item.product[0] : (item.product || (Array.isArray(item.products) ? item.products[0] : item.products))
        }))
      }

      setOrder(normalizedData)

      if (normalizedData.courier_name) setCourierName(normalizedData.courier_name)
      if (normalizedData.tracking_number) setTrackingNumber(normalizedData.tracking_number)
      if (normalizedData.tracking_url) setTrackingUrl(normalizedData.tracking_url)

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
     if (order) {
      setNewStatus(order.status)
      if (order.estimated_delivery_date) {
        setEstimatedDeliveryDate(new Date(order.estimated_delivery_date).toISOString().split('T')[0])
      } else {
        const defaultDate = new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
        setEstimatedDeliveryDate(defaultDate.toISOString().split('T')[0])
      }
    }
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
          estimated_delivery_date: estimatedDeliveryDate ? new Date(estimatedDeliveryDate).toISOString() : undefined,
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast('Copied to clipboard', 'success')
    setTimeout(() => setCopiedId(null), 2000)
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
          <button onClick={onClose} className="px-6 py-2.5 admin-bg-elevated admin-text-primary rounded-full text-sm font-medium hover:admin-bg-hover transition-colors border-none outline-none cursor-pointer">
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
                   (order.addresses?.address || '').toLowerCase().includes('pickup') ||
                   (order.pickup_contact && Object.keys(order.pickup_contact).length > 0);

  const getAddressField = (field: string, fallback: string = 'N/A') => {
    if (order.addresses && order.addresses[field]) return order.addresses[field]
    if (order.pending_address && order.pending_address[field]) return order.pending_address[field]
    if (isPickup && order.pickup_contact && order.pickup_contact[field]) return order.pickup_contact[field]
    return fallback
  }

  const address = order.addresses || {}

  const deliveryStatuses = [
    { label: 'Pending Payment', value: 'pending' },
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
    { label: 'Pending Payment', value: 'pending' },
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

  const itemsSubtotal = order.total_amount - (order.shipping_cost || 0)

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Order #${order.order_number}`}>
        <div className="space-y-6 max-h-[75vh] overflow-y-auto overscroll-contain pr-1 sm:pr-2 no-scrollbar admin-text-primary pb-6 text-left font-sans select-none">
          
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono admin-text-accent">{order.order_number}</p>
                  <CopyButton text={order.order_number} id="order_num" copiedId={copiedId} onClick={copyToClipboard} />
                </div>
              </div>
              <div>
                <p className="text-[10px] admin-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Package className="w-3.5 h-3.5" /> Total</p>
                <p className="text-base font-medium admin-text-primary">{formatCurrency(order.total_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] admin-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Truck className="w-3.5 h-3.5" /> Delivery</p>
                <p className="text-sm font-bold text-[#93D7A4] capitalize">{isPickup ? 'Store Pickup' : 'Standard Delivery'}</p>
              </div>
            </div>
            
            {order.payment_status === 'paid' && (
              <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t admin-border">
                <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="customer" textLabel="Customer Invoice" className="flex-1 justify-center px-4 py-2 admin-bg-elevated admin-text-primary rounded-full text-xs font-medium hover:admin-bg-hover transition-colors flex items-center gap-2 border admin-border cursor-pointer" />
                <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="merchant" textLabel="Owner Tax Invoice" className="flex-1 justify-center px-4 py-2 admin-bg-elevated admin-text-primary rounded-full text-xs font-medium hover:admin-bg-hover transition-colors flex items-center gap-2 border admin-border cursor-pointer" />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold uppercase tracking-wider admin-text-primary flex items-center gap-2">
                <Package className="w-4 h-4 admin-text-accent" /> Order Details
              </h3>
              <span className="text-xs font-bold admin-text-muted admin-bg-primary px-2.5 py-1 rounded-full border admin-border">
                {order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} units
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {order.order_items?.map((item: any, index: number) => {
                const cleanProductName = item.products?.name || 'Product'
                const displayHeadingTitle = item.variant_string && !cleanProductName.includes(`(${item.variant_string})`)
                  ? `${cleanProductName} (${item.variant_string})`
                  : cleanProductName

                const isWholesaleMode = item.purchase_type === 'wholesale' || item.purchase_type === 'variant_wholesale'

                return (
                  <div key={item.id} className="admin-bg-primary border admin-border rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 hover:border-[#44474A] transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold admin-text-primary text-[15px] sm:text-base leading-tight capitalize">
                          {order.order_items.length > 1 ? `${index + 1}. ` : ''}{displayHeadingTitle.toLowerCase()}
                        </h4>

                        <div className="flex flex-col gap-1.5 pt-2">

                          {isWholesaleMode && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit lowercase">
                              <Tag className="w-2.5 h-3" />Wholesale price  applied
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold admin-text-primary text-base">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <div className="admin-bg-card px-3 py-1.5 rounded-full border admin-border">
                        <span className="admin-text-muted">Quantity:</span> <span className="font-bold admin-text-primary">{item.quantity}</span>
                      </div>
                      <div className="admin-bg-card px-3 py-1.5 rounded-full border admin-border">
                        <span className="admin-text-muted">Unit Rate:</span> <span className="font-bold admin-text-primary">{formatCurrency(item.price || 0)}</span>
                      </div>
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-stone-300 font-normal line-through font-mono">{formatCurrency(item.original_price)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-6 border-t admin-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="admin-text-muted">Items Subtotal</span>
                <span className="admin-text-primary font-medium">{formatCurrency(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="admin-text-muted">Delivery Fee ({order.shipping_method || 'Standard'})</span>
                <span className="admin-text-primary font-medium">{order.shipping_cost ? formatCurrency(order.shipping_cost) : <span className="text-[#93D7A4]">Free</span>}</span>
              </div>
              <div className="flex justify-between items-center font-medium pt-5 border-t admin-border mt-2">
                <span className="text-lg admin-text-primary">Grand Total Paid</span>
                <span className="text-2xl font-bold admin-text-primary tracking-tight">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-md font-bold uppercase tracking-wider admin-text-primary mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 admin-text-accent" /> 
              {isPickup ? 'Store Pickup Details' : 'Shipping  Address'}
            </h3>
            <div className="admin-bg-primary rounded-[24px] p-5 sm:p-6 border admin-border">
              {isPickup ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest">Store Branch</p>
                    <p className="text-lg font-medium admin-text-primary">{siteConfig.name}</p>
                    <p className="text-sm admin-text-secondary mt-2 leading-relaxed">
                      {siteConfig.address.line1}, {siteConfig.address.line2}<br />
                      {siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest">Contact Person</p>
                    <p className="text-base admin-text-primary font-medium flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-[#0B57D0]" /> {order.pickup_contact?.name || siteConfig.contact.phone.primary}
                    </p>
                    {order.pickup_contact?.phone && (
                      <p className="text-xs font-mono font-semibold text-blue-600 mt-1 pl-6">buyer phone: +91 {order.pickup_contact.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest mb-1">Customer Details</p>
                      <p className="text-lg font-bold admin-text-primary capitalize">{address.name?.toLowerCase() || 'N/A'}</p>
                      <a href={`tel:${address.phone}`} className="text-[#0B57D0] hover:admin-text-accent text-sm font-medium flex items-center gap-2 mt-1 cursor-pointer transition-colors font-mono">
                        {address.phone || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest mb-1">Delivery Address</p>
                      <p className="text-sm admin-text-secondary leading-relaxed capitalize">
                        {address.address_line1 || address.address}<br />
                        {address.address_line2 && <>{address.address_line2.toLowerCase()}<br /></>}
                        {address.city?.toLowerCase() || 'N/A'} - <span className="font-bold admin-text-primary font-mono">{address.pincode || 'N/A'}</span><br />
                        {address.state?.toLowerCase() || 'N/A'}, {address.country || 'India'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 admin-bg-primary p-5 rounded-[24px] border border-transparent">
                    <div>
                      <p className="text-[11px] admin-text-muted font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                         Area Landmark
                      </p>
                      <p className="text-sm admin-text-primary font-medium italic capitalize">
                        {address.landmark ? `"${address.landmark.toLowerCase()}"` : 'No landmark provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] admin-text-muted font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                         Delivery Notes
                      </p>
                      <p className="text-sm admin-text-primary leading-relaxed">
                        {address.delivery_instructions || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
             <h3 className="text-md font-bold uppercase tracking-wider admin-text-primary mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 admin-text-accent" /> Payment Details
            </h3>
            <div className="admin-bg-primary rounded-[24px] p-5 sm:p-6 border admin-border space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="admin-text-muted">Payment Mode</span>
                <span className="admin-text-primary font-normal tracking-wide">Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="admin-text-muted">Payment Verification</span>
                <OrderStatusBadge status={order.payment_status} type="payment" />
              </div>
              {order.razorpay_payment_id && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-[11px] admin-text-muted font-normal tracking-widest">Transaction ID</span>
                  <div className="flex items-center gap-2 admin-bg-card px-2 py-1 rounded-md border admin-border w-fit max-w-full justify-between">
                    <span className="text-[11px] font-mono admin-text-accent break-all select-all">{order.razorpay_payment_id}</span>
                    <CopyButton text={order.razorpay_payment_id} id="pay_id" copiedId={copiedId} onClick={copyToClipboard} />
                  </div>
                </div>
              )}
              {order.razorpay_order_id && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-[11px] admin-text-muted font-normal tracking-widest">Order ID</span>
                  <div className="flex items-center gap-2 admin-bg-card px-2 py-1 rounded-md border admin-border w-fit max-w-full justify-between">
                    <span className="text-[11px] font-mono admin-text-accent break-all select-all">{order.razorpay_order_id}</span>
                    <CopyButton text={order.razorpay_order_id} id="razor_order_id" copiedId={copiedId} onClick={copyToClipboard} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t admin-border">
            <h3 className="text-[15px] font-bold admin-text-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 admin-text-accent" />
              Action
            </h3>
            <div className="space-y-5 admin-bg-primary p-5 sm:p-6 rounded-[24px] border admin-border">
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium admin-text-muted">Current Status</span>
                <OrderStatusBadge status={order.status} type="order" />
              </div>
              
              <select
                value={newStatus}
                title="Select new order status"
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-5 py-3.5 admin-bg-card border admin-border admin-text-primary rounded-full text-xs font-bold focus:outline-none focus:border-[#A8C7FA] transition-colors appearance-none cursor-pointer text-center"
              >
                {displayStatuses.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {newStatus === 'shipped' && !isPickup && (
                <div className="space-y-3 admin-bg-card p-4 rounded-[20px] border admin-border animate-in fade-in duration-150">
                  <p className="text-[10px] font-bold admin-text-accent mb-2 uppercase tracking-widest">Dispatch Details</p>
                  <input
                    type="text"
                    value={courierName}
                    title="Courier Name"
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Courier Name (e.g., Delhivery, BlueDart) *"
                    className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                  <input
                    type="text"
                    value={trackingNumber}
                    title="Tracking Number"
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking Number / AWB *"
                    className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                  <input
                    type="url"
                    value={trackingUrl}
                    title="Tracking URL"
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="Tracking URL (Optional)"
                    className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors"
                  />
                </div>
              )}

              <div className="space-y-3 admin-bg-card p-4 rounded-[20px] border admin-border mt-4">
                <p className="text-[12px] font-bold admin-text-accent mb-2 normal tracking-widest">Estimated Delivery Date</p>
                <input
                  type="date"
                  value={estimatedDeliveryDate}
                  title="Estimated Delivery Date"
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary rounded-[14px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors cursor-pointer"
                />
              </div>

              {newStatus === 'cancelled' && (
                <textarea
                  value={reason}
                  title="Cancellation Reason"
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Required: Reason for cancellation..."
                  rows={3}
                  className="w-full px-4 py-3 admin-bg-card border admin-border admin-text-primary placeholder:admin-text-muted rounded-[20px] text-sm focus:outline-none focus:border-[#A8C7FA] transition-colors resize-none"
                />
              )}

              <button
                type="button"
                onClick={handleInitiateUpdate}
                disabled={isUpdateDisabled}
                className={`w-full py-4 rounded-full text-sm font-bold tracking-wide transition-all border-none outline-none cursor-pointer ${
                  isUpdateDisabled 
                    ? 'admin-bg-card admin-text-muted cursor-not-allowed border admin-border' 
                    : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] border-transparent shadow-lg shadow-blue-900/20 active:scale-[0.99]'
                }`}
              >
                Update to {displayStatuses.find(s => s.value === newStatus)?.label || newStatus}
              </button>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="pt-2">
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold bg-[#3C1E0A]/40 text-[#F9AB00] hover:bg-[#3C1E0A] hover:text-[#F9AB00] border border-transparent transition-colors cursor-pointer outline-none"
              >
                Delete Order Permanently
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