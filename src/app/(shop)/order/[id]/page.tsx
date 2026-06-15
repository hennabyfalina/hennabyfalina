// src/app/(shop)/order/[id]/page.tsx

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/ui/Container'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { ChevronLeft, X, CheckCircle2, ArrowUpRight } from 'lucide-react'
import PrintButton from '@/components/order/PrintButton'
import TrackingTimeline from '@/components/order/TrackingTimeline'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

interface OrderPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ msg?: string, new_order?: string }>
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const supabase = await createClient()
  const { id } = await params
  
  const resolvedSearchParams = await searchParams
  const msg = resolvedSearchParams?.msg
  const isNewOrder = resolvedSearchParams?.new_order === 'true'

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect(`/login?next=/order/${id}`)
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let query = supabase
    .from('orders')
    .select(`
      *,
      addresses (*),
      order_items (
        *,
        products (*)
      )
    `)
    .eq('user_id', user.id)

  if (isUUID) {
    query = query.eq('id', id)
  } else {
    query = query.eq('order_number', id)
  }

  const { data: order, error: orderError } = await query.single()

  if (orderError || !order) {
    notFound()
  }

  if (order.payment_status !== 'paid') {
    redirect('/profile/orders?filter=failed')
  }

  const isCancelled = order.status === 'cancelled'
  const shippingCost = order.shipping_cost ?? (order.total_amount > 1000 ? 0 : 50)
  const subtotal = order.total_amount - shippingCost

  const isStorePickup = order.shipping_method === 'pickup' || 
                        order.delivery_method === 'pickup' ||
                        order.addresses?.delivery_method === 'pickup' ||
                        order.addresses?.address_line1?.toLowerCase().includes('pickup') || 
                        order.addresses?.address?.toLowerCase().includes('pickup') ||
                        (order.pickup_contact && Object.keys(order.pickup_contact).length > 0)
  
  const deliveryMethodLabel = isStorePickup ? 'Store Pickup' : 'Standard Delivery'

  const getAddressField = (field: string, fallback: string = 'N/A'): string => {
    if (order.addresses && order.addresses[field]) return order.addresses[field]
    if (order.pending_address && order.pending_address[field]) return order.pending_address[field]
    if (isStorePickup && order.pickup_contact && order.pickup_contact[field]) return order.pickup_contact[field]
    return fallback
  }

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
    return phone
  }

  const deliveryDate = order.estimated_delivery_date || new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const customerName = getAddressField('name')
  const customerPhone = getAddressField('phone')
  const customerAddressLine1 = getAddressField('address_line1')
  const customerAddressLine2 = getAddressField('address_line2')
  const customerCity = getAddressField('city')
  const customerState = getAddressField('state')
  const customerPincode = getAddressField('pincode')
  const customerLandmark = getAddressField('landmark')
  const customerInstructions = getAddressField('delivery_instructions')
  const customerCountry = getAddressField('country', 'India')

  return (
    <div className="min-h-screen bg-white py-8 md:py-16 font-sans antialiased select-none text-left pb-24">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Left-Aligned Left Return Path Link */}
        <div className="mb-6">
          <Link href="/profile/orders" className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1 w-fit capitalize">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} /> 
            Back to Orders
          </Link>
        </div>

        {/* Feature Policy Information Notice banner */}
        {(msg === 'cancel_soon' || msg === 'return_soon') && (
          <div className="mb-10 p-4 bg-stone-50 rounded-2xl text-[13px] font-semibold text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-stone-100/40">
            <p className="capitalize leading-relaxed">
              {msg === 'cancel_soon' ? 'Automated parameters cancellation is disabled for active builds. Connect with customer support.' : 'Automated return logging options are currently offline. Connect with customer support.'}
            </p>
            <div className="flex items-center gap-2.5 shrink-0">
              <a href={`mailto:orders@hennabyfalina.com?subject=${msg === 'cancel_soon' ? 'Cancel' : 'Return'} Request - Order ${order.order_number}`} className="px-4 h-9 bg-white border border-stone-200 hover:border-gray-900 text-gray-900 rounded-xl transition-colors flex items-center text-xs font-bold capitalize whitespace-nowrap">
                Email Support
              </a>
              <Link href={`/order/${id}`} className="p-1.5 text-gray-400 hover:text-gray-950 transition-colors outline-none">
                <X className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        )}

        {/* Left-Aligned Typography Header Strip Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">
              Order Details
            </h1>
            <div className="flex items-center gap-3 mt-2 text-[14px] font-semibold text-gray-400 capitalize">
              <p>Placed {formatDate(order.created_at)}</p>
              <span className="w-1 h-1 rounded-full bg-stone-200"></span>
              <p>Reference #{order.order_number}</p>
            </div>
          </div>
          
          {/* Action Control Pills */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {['pending', 'confirmed', 'processing'].includes((order.status || '').toLowerCase()) && (
              <Link href={`/order/${id}?msg=cancel_soon`} className="h-9 px-4 bg-stone-50 border border-transparent hover:border-stone-200 text-gray-600 font-semibold rounded-xl transition-colors text-[13px] flex items-center justify-center capitalize">
                Cancel Order
              </Link>
            )}
            {(order.status || '').toLowerCase() === 'delivered' && (
              <Link href={`/order/${id}?msg=return_soon`} className="h-9 px-4 bg-stone-50 border border-transparent hover:border-stone-200 text-gray-600 font-semibold rounded-xl transition-colors text-[13px] flex items-center justify-center capitalize">
                Return Item
              </Link>
            )}
            <PrintButton orderId={order.id} orderNumber={order.order_number} />
          </div>
        </div>

        {/* Live Delivery Status Timeline Tracker Layout */}
        {!isCancelled && !order.status.includes('cancel') && !order.status.includes('return') && (
          <div className="mb-14 border-b border-stone-100 pb-12">
            <h2 className="text-[16px] sm:text-[17px] font-normal text-gray-950 tracking-tight mb-8 capitalize">
              {order.status === 'delivered' || order.status === 'picked_up' ? (
                <span>{isStorePickup ? 'Picked up on' : 'Delivered on'} {formatDate(order.updated_at || order.created_at)}</span>
              ) : isStorePickup ? (
                <span>Ready for studio pickup</span>
              ) : (
                <span>Estimated arrival status: {formatDate(deliveryDate)}</span>
              )}
            </h2>
            <TrackingTimeline 
              status={order.status} 
              isPickup={isStorePickup} 
              courierName={order.courier_name}
              trackingNumber={order.tracking_number}
              trackingUrl={order.tracking_url}
              shippedAt={order.shipped_at}
            />
          </div>
        )}

        {/* Borderless Product Ledger Stream */}
        <div className="mb-14 border-b border-stone-100 pb-10">
          <h2 className="text-[18px] font-normal text-gray-950 tracking-tight mb-6 capitalize">Items Ordered</h2>
          <div className="divide-y divide-gray-100 flex flex-col w-full">
            {order.order_items.map((item: any) => {
              let imageUrl = '/placeholder-product.svg'
              const rawImage = item.products?.images?.[0]
              if (rawImage) {
                imageUrl = rawImage.startsWith('http') || rawImage.startsWith('/') || rawImage.startsWith('data:')
                  ? rawImage
                  : getPublicUrl(rawImage)
              }
              
              return (
                <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-6 items-start justify-between w-full">
                  
                  {/* Image Thumb and details tracking columns */}
                  <div className="flex gap-5 flex-1 min-w-0 w-full text-left">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-50 border border-stone-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <Image src={imageUrl} fill sizes="(max-width: 640px) 80px, 96px" unoptimized={imageUrl.includes('token=')} className="object-contain mix-blend-multiply p-1.5" alt={item.products?.name || 'Product'} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <Link href={`/product/${item.products?.slug}`} className="text-[15px] sm:text-[16px] font-bold text-gray-900 hover:text-stone-500 transition-colors line-clamp-2 capitalize tracking-tight leading-snug">
                        {item.products?.name}
                      </Link>
                      
                      <div className="mt-2 flex items-baseline gap-2.5 text-[14px]">
                        <span className="font-bold text-gray-950">{formatCurrency(item.price)}</span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-[12px] text-gray-400 line-through font-medium">{formatCurrency(item.original_price)}</span>
                        )}
                        <span className="text-stone-200 text-xs px-0.5">|</span>
                        <span className="text-gray-400 font-semibold capitalize">Quantity: {item.quantity}</span>
                      </div>

                      {item.products?.description && (
                        <p className="text-[13px] text-gray-400 font-medium mt-2 line-clamp-1 capitalize">{item.products.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions column on right side matching grid parameters */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0 w-full sm:w-44 pt-0.5 justify-between sm:justify-start">
                    <div className="text-[16px] font-bold text-gray-950 tracking-tight">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <Link href={`/product/${item.products?.slug}`} className="h-9 px-5 bg-stone-50 border border-transparent hover:border-stone-200 text-gray-900 font-semibold rounded-xl text-[13px] transition-colors flex items-center justify-center capitalize w-fit sm:w-full">
                      Buy It Again
                    </Link>
                  </div>

                </div>
              )
            })}
          </div>
        </div>

        {/* 🚀 THE APPLE-STYLE 3-COLUMN UNBOXED PARAMETER MATRIX ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 text-[14px] text-left items-start pt-2">
          
          {/* Column 1: Fulfillment Shipping Metadata */}
          <div className="space-y-3 font-medium text-gray-500">
            <h3 className="font-bold text-[15px] tracking-tight text-gray-950 pb-2 border-b border-stone-50 capitalize">Shipping Details</h3>
            <p className="text-gray-900 font-bold text-[14px]">{deliveryMethodLabel}</p>
            <p className="text-gray-900 font-semibold">{customerName}</p>
            
            {!isStorePickup ? (
              <div className="leading-relaxed space-y-0.5">
                {customerAddressLine1 !== 'N/A' ? (
                  <>
                    <p>{customerAddressLine1}</p>
                    {customerAddressLine2 && <p>{customerAddressLine2}</p>}
                    <p>{customerCity} – {customerPincode}</p>
                    <p>{customerState}, {customerCountry}</p>
                  </>
                ) : (
                  <p className="text-stone-300 italic">Address details pending compilation</p>
                )}
              </div>
            ) : (
              <p>Postal Pincode: {customerPincode}</p>
            )}

            <p className="pt-1">Phone Link: <span className="text-gray-800 font-semibold tracking-wide">{formatPhoneNumber(customerPhone)}</span></p>

            {customerInstructions && customerInstructions !== 'N/A' && (
              <p className="pt-1.5 text-stone-400 italic text-[13px]">Note: &quot;{customerInstructions}&quot;</p>
            )}
          </div>

          {/* Column 2: Secured Gateway Context */}
          <div className="space-y-3 font-medium text-gray-500">
            <h3 className="font-bold text-[15px] tracking-tight text-gray-950 pb-2 border-b border-stone-50 capitalize">Payment Context</h3>
            <p className="font-semibold text-gray-900">
              Razorpay {order.payment_method_detail || order.payment_method || 'Secured Matrix Route'}
            </p>
            <div className="flex items-center gap-2 text-[13px] font-semibold pt-1">
              <span className="text-gray-400 font-medium">Clearance Status:</span>
              <OrderStatusBadge status={order.payment_status} type="payment" className="shadow-none" />
            </div>
          </div>

          {/* Column 3: Complete Financial Order Ledger parameters */}
          <div className="space-y-3 font-medium text-gray-500">
            <h3 className="font-bold text-[15px] tracking-tight text-gray-950 pb-2 border-b border-stone-50 capitalize">Order Ledger</h3>
            <div className="space-y-2.5 text-[14px]">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Delivery Charges</span>
                <span className="text-gray-900 font-semibold">
                  {shippingCost === 0 ? 'Complimentary' : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-[16px] text-gray-950 pt-3.5 border-t border-stone-100 mt-2">
                <span className="tracking-tight">Total Amount</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

        </div>

      </Container>
    </div>
  )
}