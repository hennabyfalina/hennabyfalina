'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import OrderModal from '@/components/admin/OrderModal'
import AdminLoader from '@/components/admin/AdminLoader'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Printer, ExternalLink, MapPin, ChevronLeft, Calendar, Hash, CreditCard, Package, Phone, MessageSquare } from 'lucide-react'
import InvoiceLink from '@/components/order/InvoiceLink'
import { showToast } from '@/components/ui/Toast'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/client'

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
  const [downloadingArtwork, setDownloadingArtwork] = useState<string | null>(null)

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
      setOrder(data)
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

  if (loading) return <AdminLoader fullScreen={false} message="Loading order details..." />

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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-2 hover:admin-bg-elevated rounded-full admin-text-secondary transition-colors cursor-pointer" title="Back">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-medium tracking-tight admin-text-primary">
                Order <span className="admin-text-muted">#{order.order_number}</span>
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
                <h2 className="text-sm font-medium admin-text-primary flex items-center gap-2">
                   <Package className="w-4 h-4 admin-text-accent" /> Order Items
                </h2>
                <span className="text-xs font-bold admin-text-muted admin-bg-primary px-2.5 py-1 rounded-full border admin-border">
                  {order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} Items
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start pb-6 mb-6 border-b admin-border/50 last:border-0 last:pb-0 last:mb-0 gap-4">
                      <div className="flex-1">
                        <p className="font-medium admin-text-primary text-[17px]">{item.products?.name || 'Product'}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-sm admin-text-muted">
                            Qty: <span className="font-bold admin-text-primary">{item.quantity}</span>
                          </span>
                          <span className="w-1 h-1 rounded-full admin-border"></span>
                          <span className="text-sm admin-text-muted">
                            Rate: <span className="admin-text-primary">{formatCurrency(item.price || 0)}</span>
                          </span>
                          {item.original_price && item.price < item.original_price && (
                            <span className="px-2 py-0.5 bg-[#214332]/40 text-[#93D7A4] rounded text-[10px] font-bold tracking-wider ml-1">
                              TIER PRICING
                            </span>
                          )}
                        </div>

                        {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                          <div className="mt-4 border-l-2 border-[#0B57D0] pl-4 py-1.5 space-y-3 w-full max-w-md admin-bg-primary rounded-r-2xl p-4">
                            <div className="flex items-center gap-2 text-xs font-bold admin-text-accent uppercase tracking-wide">
                              <Printer className="w-3.5 h-3.5" /> {item.printing_type}
                            </div>
                            
                            {item.artwork_urls && item.artwork_urls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {item.artwork_urls.map((url: string, idx: number) => (
                                  <button 
                                    key={idx}
                                    onClick={() => handleSecureDownload(url)}
                                    disabled={downloadingArtwork === url}
                                    className="inline-flex items-center gap-2 px-4 py-2 admin-bg-elevated hover:admin-bg-hover border admin-border text-xs font-medium admin-text-accent rounded-full transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {downloadingArtwork === url ? (
                                      <><div className="w-3 h-3 border-2 border-[#0B57D0] border-t-transparent rounded-full animate-spin" /> Fetching...</>
                                    ) : (
                                      <><ExternalLink className="w-3.5 h-3.5" /> View File {idx + 1}</>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {item.printing_instructions && (
                              <div className="text-xs leading-relaxed admin-text-secondary">
                                <span className="font-bold admin-text-primary block mb-1">Customer Note:</span> 
                                &quot;{item.printing_instructions}&quot;
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium admin-text-primary text-lg">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
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
                      <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="customer" textLabel="Customer Tax Invoice" className="flex-1 justify-center px-4 py-2 admin-bg-elevated admin-text-primary rounded-full text-xs font-medium hover:admin-bg-hover transition-colors flex items-center gap-2 border admin-border" />
                      <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="merchant" textLabel="Owner Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#3C1E0A]/40 text-[#F9AB00] rounded-full text-xs font-medium hover:bg-[#3C1E0A] transition-colors flex items-center gap-2 border border-[#4E270D]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b admin-border admin-bg-primary/30 flex items-center gap-2">
                <MapPin className="w-4 h-4 admin-text-accent" />
                <h2 className="text-sm font-medium admin-text-primary">
                  {isPickup ? 'Store Pickup Details' : 'Customer Shipping Address'}
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
                        <Phone className="w-4 h-4 text-[#0B57D0]" /> {siteConfig.contact.phone.primary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest mb-1">Recipient</p>
                        <p className="text-lg font-bold admin-text-primary">{address.name || 'N/A'}</p>
                        <a href={`tel:${address.phone}`} className="text-[#0B57D0] hover:admin-text-accent text-sm font-medium flex items-center gap-2 mt-1 cursor-pointer transition-colors">
                          <Phone className="w-4 h-4" /> {address.phone || 'N/A'}
                        </a>
                      </div>
                      <div>
                        <p className="text-[10px] admin-text-muted font-bold uppercase tracking-widest mb-1">Full Address</p>
                        <p className="text-sm admin-text-secondary leading-relaxed">
                          {address.address_line1 || address.address}<br />
                          {address.address_line2 && <>{address.address_line2}<br /></>}
                          {address.city || 'N/A'} - <span className="font-bold admin-text-primary">{address.pincode || 'N/A'}</span><br />
                          {address.state || 'N/A'}, {address.country || 'India'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 admin-bg-primary p-5 rounded-[24px] border admin-border">
                      <div>
                        <p className="text-[11px] admin-text-muted font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                           <MapPin className="w-3 h-3" /> Area Landmark
                        </p>
                        <p className="text-sm admin-text-primary font-medium italic">
                          {address.landmark ? `"${address.landmark}"` : 'No landmark provided'}
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

          <div className="space-y-6">
            
            <div className="admin-bg-card rounded-[32px] border admin-border p-6 sm:p-8 shadow-sm">
              <h2 className="text-sm font-medium admin-text-muted uppercase tracking-widest mb-6">Workflow Status</h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-2 admin-bg-primary p-5 rounded-[24px] border admin-border">
                  <span className="text-[11px] admin-text-muted font-bold uppercase tracking-widest">Current Stage</span>
                  <div className="mt-1">
                    <OrderStatusBadge status={order.status} type="order" />
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="w-full py-4 text-sm font-bold text-white bg-[#0B57D0] rounded-full hover:bg-[#0842A0] transition-all cursor-pointer shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                >
                  Change Order Status
                </button>
              </div>
            </div>

            <div className="admin-bg-card rounded-[32px] border admin-border p-6 sm:p-8 shadow-sm">
              <h2 className="text-sm font-medium admin-text-muted uppercase tracking-widest mb-6">Payment Tracking</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center admin-bg-primary p-4 rounded-[20px] border admin-border">
                  <span className="text-xs admin-text-muted font-medium">Method</span>
                  <span className="text-sm admin-text-primary font-bold capitalize flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#0B57D0]" />
                    Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center admin-bg-primary p-4 rounded-[20px] border admin-border">
                  <span className="text-xs admin-text-muted font-medium">Payment Status</span>
                  <OrderStatusBadge status={order.payment_status} type="payment" />
                </div>
                {order.razorpay_payment_id && (
                  <div className="admin-bg-primary p-4 rounded-[20px] border admin-border space-y-2">
                    <span className="text-[10px] admin-text-muted font-bold uppercase tracking-widest">Razorpay Txn ID</span>
                    <p className="text-xs font-mono admin-text-accent truncate select-all">{order.razorpay_payment_id}</p>
                  </div>
                )}
                {order.paid_at && (
                   <div className="flex justify-between items-center admin-bg-primary p-4 rounded-[20px] border admin-border">
                    <span className="text-xs admin-text-muted font-medium">Timestamp</span>
                    <span className="text-[11px] font-bold admin-text-primary">{new Date(order.paid_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
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