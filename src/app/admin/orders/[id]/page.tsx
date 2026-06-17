// src/app/admin/orders/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import OrderModal from '@/components/admin/OrderModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Printer, ExternalLink, MapPin, ChevronLeft, Calendar, Hash, CreditCard, Package, Phone, MessageSquare, Copy, Check, Tag, Sliders } from 'lucide-react'
import InvoiceLink from '@/components/order/InvoiceLink'
import { showToast } from '@/components/ui/Toast'
import { siteConfig } from '@/config/site'
import { OrderDetailSkeleton } from './OrderDetailSkeleton';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

const CopyButton = ({ text, id, copiedId, onClick }: { text: string, id: string, copiedId: string | null, onClick: (text: string, id: string) => void }) => (
  <button type="button" onClick={() => onClick(text, id)} className="p-1.5 hover:admin-bg-elevated rounded-md transition-colors admin-text-muted hover:admin-text-accent cursor-pointer shrink-0 border-none bg-transparent outline-none">
    {copiedId === id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
  </button>
)

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setOrderId(id)
    }
    unwrapParams()
  }, [params])

  const loadOrder = async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order')
      const data = await response.json()
      
      // 🔒 BULLETPROOF ARRAY NORMALIZATION
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) loadOrder()
  }, [orderId])

  const handleOrderUpdate = () => {
    loadOrder()
    router.refresh()
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast('Copied to clipboard', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 admin-bg-card rounded-[32px] border admin-border mx-auto max-w-2xl mt-12">
        <p className="text-red-400 font-medium text-lg">{error || 'Order not found'}</p>
        <Link href="/admin/orders" className="mt-6 px-8 py-3 bg-[#0B57D0] text-white rounded-full transition-colors font-medium cursor-pointer">
          Return to Orders
        </Link>
      </div>
    )
  }

  const address = order.addresses || {}
  const isPickup = order.shipping_method === 'pickup'

  return (
    <>
      <div className="flex flex-col gap-6 font-sans select-none antialiased">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-2 hover:admin-bg-elevated rounded-full admin-text-secondary transition-colors cursor-pointer" title="Back">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-medium tracking-tight admin-text-primary">
                Order <span className="admin-text-muted font-mono tracking-wide">#{order.order_number}</span>
              </h1>
              <p className="text-xs admin-text-muted font-medium uppercase tracking-wider mt-0.5">
                Manage Fulfillment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-right mr-2">
                <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest leading-none">Placed On</p>
                <p className="text-sm font-medium admin-text-primary mt-1">
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
             <OrderStatusBadge status={order.status} type="order" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b admin-border flex items-center justify-between admin-bg-primary/30">
                <h2 className="text-xs font-bold uppercase tracking-wider admin-text-primary flex items-center gap-2">
                   <Package className="w-4 h-4 admin-text-accent" /> ITEM DETAILS SNAPSHOT
                </h2>
                <span className="text-xs font-bold admin-text-muted admin-bg-primary px-3 py-1 rounded-full border admin-border">
                  {order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} units
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {order.order_items?.map((item: any, index: number) => {
                    const cleanProductName = item.products?.name || 'Product'
                    const displayHeadingTitle = item.variant_string && !cleanProductName.includes(`(${item.variant_string})`)
                      ? `${cleanProductName}`
                      : cleanProductName

                    const isWholesaleMode = item.purchase_type === 'wholesale' || item.purchase_type === 'variant_wholesale'

                    return (
                      <div key={item.id} className="admin-bg-primary border admin-border rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 hover:border-stone-400 transition-colors">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-bold admin-text-primary text-[15px] sm:text-base leading-tight capitalize">
                              {order.order_items.length > 1 ? `${index + 1}. ` : ''}{displayHeadingTitle.toLowerCase()}
                            </h4>

                            <div className="flex flex-col gap-1.5 pt-2">
                              {item.variant_string && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md w-fit lowercase">
                                  <Sliders className="w-2.5 h-3" /> choice tag: {item.variant_string}
                                </span>
                              )}
                              {isWholesaleMode && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit lowercase">
                                  <Tag className="w-2.5 h-3" /> volume wholesale tier contract applied
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
                    <span className="admin-text-muted">Items Total</span>
                    <span className="admin-text-primary font-medium">{formatCurrency(order.total_amount - (order.shipping_cost || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="admin-text-muted">Delivery Fee ({order.shipping_method || 'Standard'})</span>
                    <span className="admin-text-primary font-medium">{order.shipping_cost ? formatCurrency(order.shipping_cost) : <span className="text-[#93D7A4]">Free</span>}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium pt-5 border-t admin-border mt-2">
                    <span className="text-lg admin-text-primary">Grand Total Paid</span>
                    <span className="text-2xl font-bold admin-text-primary tracking-tight">{formatCurrency(order.total_amount)}</span>
                  </div>
                  
                  {order.payment_status === 'paid' && (
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t admin-border">
                      <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="customer" textLabel="Customer Invoice" className="flex-1 justify-center px-4 py-2 admin-bg-elevated admin-text-primary rounded-full text-xs font-medium hover:admin-bg-hover transition-colors flex items-center gap-2 border admin-border cursor-pointer" />
                      <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="merchant" textLabel="Owner Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#3C1E0A]/40 text-[#F9AB00] rounded-full text-xs font-medium hover:bg-[#3C1E0A] transition-colors flex items-center gap-2 border border-[#4E270D] cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b admin-border admin-bg-primary/30 flex items-center gap-2">
                <MapPin className="w-4 h-4 admin-text-accent" />
                <h2 className="text-xs font-bold uppercase tracking-wider admin-text-primary">
                  {isPickup ? 'Store Pickup Details' : 'Fulfillment Destination Address'}
                </h2>
              </div>
              <div className="p-8">
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
                        <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest mb-1">Consignee Recipient</p>
                        <p className="text-lg font-bold admin-text-primary capitalize">{address.name?.toLowerCase() || 'N/A'}</p>
                        <a href={`tel:${address.phone}`} className="text-[#0B57D0] hover:admin-text-accent text-sm font-medium flex items-center gap-2 mt-1 cursor-pointer transition-colors font-mono">
                          <Phone className="w-4 h-4" /> {address.phone || 'N/A'}
                        </a>
                      </div>
                      <div>
                        <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest mb-1">Destination Destination</p>
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
                           <MapPin className="w-3 h-3" /> Area Landmark
                        </p>
                        <p className="text-sm admin-text-primary font-medium italic capitalize">
                          {address.landmark ? `"${address.landmark.toLowerCase()}"` : 'No landmark provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] admin-text-muted font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                           <MessageSquare className="w-3 h-3" /> Delivery Notes
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
          </div>

          <div>
             <h3 className="text-xs font-bold uppercase tracking-wider admin-text-primary mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 admin-text-accent" /> Payment Security Context
            </h3>
            <div className="admin-bg-primary rounded-[24px] p-5 sm:p-6 border admin-border space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="admin-text-muted">Settlement Engine</span>
                <span className="admin-text-primary font-bold uppercase tracking-wide">Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="admin-text-muted">Clearance Verification</span>
                <OrderStatusBadge status={order.payment_status} type="payment" />
              </div>
              {order.razorpay_payment_id && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-[10px] admin-text-muted font-bold uppercase tracking-widest">Transaction Token ID</span>
                  <div className="flex items-center gap-2 admin-bg-card px-2 py-1 rounded-md border admin-border w-fit max-w-full justify-between">
                    <span className="text-[11px] font-mono admin-text-accent break-all select-all">{order.razorpay_payment_id}</span>
                    <CopyButton text={order.razorpay_payment_id} id="pay_id" copiedId={copiedId} onClick={copyToClipboard} />
                  </div>
                </div>
              )}
              {order.razorpay_order_id && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-[10px] admin-text-muted font-bold uppercase tracking-widest">Gateway Order Hash</span>
                  <div className="flex items-center gap-2 admin-bg-card px-2 py-1 rounded-md border admin-border w-fit max-w-full justify-between">
                    <span className="text-[11px] font-mono admin-text-accent break-all select-all">{order.razorpay_order_id}</span>
                    <CopyButton text={order.razorpay_order_id} id="razor_order_id" copiedId={copiedId} onClick={copyToClipboard} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t admin-border">
            <h3 className="text-[11px] font-bold admin-text-muted uppercase tracking-widest mb-3">Workflow Action</h3>
            <div className="space-y-5 admin-bg-primary p-5 sm:p-6 rounded-[24px] border admin-border">
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium admin-text-muted">Current Status</span>
                <OrderStatusBadge status={order.status} type="order" />
              </div>
              
              <button
                type="button"
                onClick={() => setShowStatusModal(true)}
                className="w-full py-4 text-sm font-bold text-white bg-[#0B57D0] rounded-full hover:bg-[#0842A0] transition-all cursor-pointer shadow-lg shadow-blue-900/10 active:scale-[0.98] border-none outline-none"
              >
                Change Order Status
              </button>
            </div>
          </div>
        </div>
      </div>

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