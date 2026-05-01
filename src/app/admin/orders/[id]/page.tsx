// src/app/admin/orders/[id]/page.tsx

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

  useEffect(() => {
    if (orderId) loadOrder()
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
      <div className="flex flex-col items-center justify-center py-20 bg-[#1E1F20] rounded-[32px] border border-[#333538] mx-auto max-w-2xl mt-12">
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
        {/* 🚨 COMPACT HEADER: Removed extra padding 🚨 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-2 hover:bg-[#282A2C] rounded-full text-[#C4C7C5] transition-colors cursor-pointer" title="Back">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-[#E3E3E3]">
                Order <span className="text-[#8E9196]">#{order.order_number}</span>
              </h1>
              <p className="text-xs text-[#8E9196] font-medium uppercase tracking-wider mt-0.5">
                Manage Fulfillment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-right mr-2">
                <p className="text-[10px] text-[#8E9196] font-bold uppercase tracking-widest leading-none">Placed On</p>
                <p className="text-sm font-medium text-[#E3E3E3] mt-1">
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
            {/* 🚨 ORDER ITEMS CARD 🚨 */}
            <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-[#333538] flex items-center justify-between bg-[#131314]/30">
                <h2 className="text-sm font-medium text-[#E3E3E3] flex items-center gap-2">
                   <Package className="w-4 h-4 text-[#A8C7FA]" /> Order Items
                </h2>
                <span className="text-xs font-bold text-[#8E9196] bg-[#131314] px-2.5 py-1 rounded-full border border-[#333538]">
                  {order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} Items
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start pb-6 mb-6 border-b border-[#333538]/50 last:border-0 last:pb-0 last:mb-0 gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-[#E3E3E3] text-[17px]">{item.products?.name || 'Product'}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-sm text-[#8E9196]">
                            Qty: <span className="font-bold text-[#E3E3E3]">{item.quantity}</span>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#333538]"></span>
                          <span className="text-sm text-[#8E9196]">
                            Rate: <span className="text-[#E3E3E3]">{formatCurrency(item.price || 0)}</span>
                          </span>
                          {item.is_bulk_pricing && (
                            <span className="px-2 py-0.5 bg-[#214332] text-[#93D7A4] rounded text-[10px] font-bold tracking-wider ml-1">WHOLESALE</span>
                          )}
                        </div>

                        {/* B2B FACTORY SECTION */}
                        {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                          <div className="mt-4 border-l-2 border-[#0B57D0] pl-4 py-1.5 space-y-3 w-full max-w-md bg-[#131314] rounded-r-2xl p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#A8C7FA] uppercase tracking-wide">
                              <Printer className="w-3.5 h-3.5" /> {item.printing_type}
                            </div>
                            
                            {/* 🚨 THE FIX: Map over artwork_urls array 🚨 */}
                            {item.artwork_urls && item.artwork_urls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {item.artwork_urls.map((url: string, idx: number) => (
                                  <button 
                                    key={idx}
                                    onClick={() => handleSecureDownload(url)}
                                    disabled={downloadingArtwork === url}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#282A2C] hover:bg-[#333538] border border-[#44474A] text-xs font-medium text-[#A8C7FA] rounded-full transition-colors cursor-pointer disabled:opacity-50"
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
                              <div className="text-xs leading-relaxed text-[#C4C7C5]">
                                <span className="font-bold text-[#E3E3E3] block mb-1">Customer Note:</span> 
                                "{item.printing_instructions}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-[#E3E3E3] text-lg">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Totals Area */}
                <div className="mt-4 pt-6 border-t border-[#333538] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8E9196]">Items Total</span>
                    <span className="text-[#E3E3E3] font-medium">{formatCurrency(order.total_amount - (order.shipping_cost || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8E9196]">Delivery Fee ({order.shipping_method || 'Standard'})</span>
                    <span className="text-[#E3E3E3] font-medium">{order.shipping_cost ? formatCurrency(order.shipping_cost) : <span className="text-[#93D7A4]">Free</span>}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium pt-5 border-t border-[#333538] mt-2">
                    <span className="text-lg text-[#E3E3E3]">Grand Total Paid</span>
                    <span className="text-2xl font-bold text-[#E3E3E3] tracking-tight">{formatCurrency(order.total_amount)}</span>
                  </div>
                  
                  {order.payment_status === 'paid' && (
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#333538]">
                      <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="customer" textLabel="Customer Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#282A2C] text-[#E3E3E3] rounded-full text-xs font-medium hover:bg-[#333538] transition-colors flex items-center gap-2 border border-[#44474A]" />
                      <InvoiceLink orderId={order.id} orderNumber={order.order_number} invoiceType="merchant" textLabel="Owner Tax Invoice" className="flex-1 justify-center px-4 py-2 bg-[#3C1E0A]/40 text-[#F9AB00] rounded-full text-xs font-medium hover:bg-[#3C1E0A] transition-colors flex items-center gap-2 border border-[#4E270D]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🚨 CORE DATA: SHIPPING & ADDRESS CARD 🚨 */}
            <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-[#333538] bg-[#131314]/30 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#A8C7FA]" />
                <h2 className="text-sm font-medium text-[#E3E3E3]">
                  {isPickup ? 'Store Pickup Details' : 'Customer Shipping Address'}
                </h2>
              </div>
              <div className="p-8">
                {isPickup ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8E9196] font-bold uppercase tracking-widest">Store Branch</p>
                      <p className="text-lg font-medium text-[#E3E3E3]">{siteConfig.name}</p>
                      <p className="text-sm text-[#C4C7C5] mt-2 leading-relaxed">
                        {siteConfig.address.line1}, {siteConfig.address.line2}<br />
                        {siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8E9196] font-bold uppercase tracking-widest">Contact Person</p>
                      <p className="text-base text-[#E3E3E3] font-medium flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-[#0B57D0]" /> {siteConfig.contact.phone.primary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-[#8E9196] font-bold uppercase tracking-widest mb-1">Recipient</p>
                        <p className="text-lg font-bold text-[#E3E3E3]">{address.name || 'N/A'}</p>
                        <a href={`tel:${address.phone}`} className="text-[#0B57D0] hover:text-[#A8C7FA] text-sm font-medium flex items-center gap-2 mt-1 cursor-pointer transition-colors">
                          <Phone className="w-4 h-4" /> {address.phone || 'N/A'}
                        </a>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8E9196] font-bold uppercase tracking-widest mb-1">Full Address</p>
                        <p className="text-sm text-[#C4C7C5] leading-relaxed">
                          {address.address_line1 || address.address}<br />
                          {address.address_line2 && <>{address.address_line2}<br /></>}
                          {address.city || 'N/A'} - <span className="font-bold text-[#E3E3E3]">{address.pincode || 'N/A'}</span><br />
                          {address.state || 'N/A'}, {address.country || 'India'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 bg-[#131314] p-5 rounded-[24px] border border-[#333538]">
                      <div>
                        <p className="text-[11px] text-[#8E9196] font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                           <MapPin className="w-3 h-3" /> Area Landmark
                        </p>
                        <p className="text-sm text-[#E3E3E3] font-medium italic">
                          {address.landmark ? `"${address.landmark}"` : 'No landmark provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#8E9196] font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                           <MessageSquare className="w-3 h-3" /> Delivery Notes
                        </p>
                        <p className="text-sm text-[#E3E3E3] leading-relaxed">
                          {address.delivery_instructions || 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🚨 RIGHT SIDEBAR: STATUS & PAYMENT 🚨 */}
          <div className="space-y-6">
            
            <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] p-6 sm:p-8 shadow-sm">
              <h2 className="text-sm font-medium text-[#8E9196] uppercase tracking-widest mb-6">Workflow Status</h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-2 bg-[#131314] p-5 rounded-[24px] border border-[#333538]">
                  <span className="text-[11px] text-[#8E9196] font-bold uppercase tracking-widest">Current Stage</span>
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

            <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] p-6 sm:p-8 shadow-sm">
              <h2 className="text-sm font-medium text-[#8E9196] uppercase tracking-widest mb-6">Payment Tracking</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#131314] p-4 rounded-[20px] border border-[#333538]">
                  <span className="text-xs text-[#8E9196] font-medium">Method</span>
                  <span className="text-sm text-[#E3E3E3] font-bold capitalize flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#0B57D0]" />
                    Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#131314] p-4 rounded-[20px] border border-[#333538]">
                  <span className="text-xs text-[#8E9196] font-medium">Payment Status</span>
                  <OrderStatusBadge status={order.payment_status} type="payment" />
                </div>
                {order.razorpay_payment_id && (
                  <div className="bg-[#131314] p-4 rounded-[20px] border border-[#333538] space-y-2">
                    <span className="text-[10px] text-[#8E9196] font-bold uppercase tracking-widest">Razorpay Txn ID</span>
                    <p className="text-xs font-mono text-[#A8C7FA] truncate select-all">{order.razorpay_payment_id}</p>
                  </div>
                )}
                {order.paid_at && (
                   <div className="flex justify-between items-center bg-[#131314] p-4 rounded-[20px] border border-[#333538]">
                    <span className="text-xs text-[#8E9196] font-medium">Timestamp</span>
                    <span className="text-[11px] font-bold text-[#E3E3E3]">{new Date(order.paid_at).toLocaleString()}</span>
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