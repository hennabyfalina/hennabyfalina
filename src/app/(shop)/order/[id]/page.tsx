// src/app/(shop)/order/[id]/page.tsx

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/ui/Container'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { ChevronLeft, X, Package, CheckCircle2 } from 'lucide-react'
import PrintButton from '@/components/order/PrintButton'
import TrackingTimeline from '@/components/order/TrackingTimeline'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import StarRating from '@/components/product/StarRating'
import ProductWishlistButton from '@/components/product/ProductWishlistButton'
import { siteConfig } from '@/config/site'
import ArtworkDownloadButton from '@/components/order/ArtworkDownloadButton'
import ClearDraftsOnMount from '@/components/order/ClearDraftsOnMount'

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

  const { data: rawOrder, error: orderError } = await query.single()

  if (orderError || !rawOrder) {
    notFound()
  }

  if (rawOrder.payment_status !== 'paid') {
    redirect('/profile/orders?filter=failed')
  }

  // Generate signed URLs for artwork files
  const orderItemsWithUrls = await Promise.all(rawOrder.order_items.map(async (item: any) => {
    let signedUrls: string[] = []
    if (item.artwork_urls && item.artwork_urls.length > 0) {
      signedUrls = await Promise.all(item.artwork_urls.map(async (url: string) => {
        const { data } = await supabase.storage
          .from('artworks')
          .createSignedUrl(url, 3600) // 1 hour
        return data?.signedUrl
      }))
    }
    return { ...item, signed_artwork_urls: signedUrls.filter(Boolean) }
  }))

  const order = { ...rawOrder, order_items: orderItemsWithUrls }
  const isPaymentPending = order.payment_status === 'pending'
  const isCancelled = order.status === 'cancelled'

  const shippingCost = order.shipping_cost ?? (order.total_amount > 1000 ? 0 : 50)
  const subtotal = order.total_amount - shippingCost

  // 🆕 IMPROVED: Better detection for store pickup
  const isStorePickup = order.shipping_method === 'pickup' || 
                        order.delivery_method === 'pickup' ||
                        order.addresses?.delivery_method === 'pickup' ||
                        order.addresses?.address_line1?.toLowerCase().includes('pickup') || 
                        order.addresses?.address?.toLowerCase().includes('pickup') ||
                        (order.pickup_contact && Object.keys(order.pickup_contact).length > 0)
  
  const deliveryMethodLabel = isStorePickup ? 'Store Pickup' : 'Standard Delivery'

  // 🆕 Helper to get address data from order (with fallbacks)
  const getAddressField = (field: string, fallback: string = 'N/A'): string => {
    // 1. Try from addresses relation
    if (order.addresses && order.addresses[field]) {
      return order.addresses[field]
    }
    // 2. Try from pending_address (for newly created orders)
    if (order.pending_address && order.pending_address[field]) {
      return order.pending_address[field]
    }
    // 3. Try from pickup_contact (for pickup orders)
    if (isStorePickup && order.pickup_contact && order.pickup_contact[field]) {
      return order.pickup_contact[field]
    }
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

  // Extract product IDs from this order (for clearing drafts)
  const productIds = order.order_items.map((item: any) => item.product_id)

  // 🆕 Get address display values with fallbacks
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
    <div className="min-h-screen bg-white">
    <Container className="py-8 md:py-12 max-w-4xl">
      <ClearDraftsOnMount productIds={productIds} />

      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile/orders" className="text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      {isNewOrder && (
        <div className="mb-6 p-4 md:p-5 bg-white border border-gray-200 rounded-2xl flex items-start justify-between gap-3 md:gap-4 shadow-sm relative animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.305-.88-.653-1.473-1.46-1.646-1.758-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-base">Order Placed Successfully!</h3>
              <p className="text-gray-600 text-sm mt-0.5 leading-snug">
                A detailed confirmation has been sent to your <span className="font-bold text-[#25D366]">WhatsApp</span>. You&apos;ll receive real-time updates as your package is prepared.
              </p>
            </div>
          </div>
          <Link href={`/order/${id}`} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors shrink-0 -mt-1 -mr-1">
            <X className="w-4 h-4" />
          </Link>
        </div>
      )}

      {(msg === 'cancel_soon' || msg === 'return_soon') && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm relative pr-8 lg:pr-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">
              {msg === 'cancel_soon' ? 'Cancelling order feature is coming soon. Please contact support for manual cancellation.' : 'Return item feature is coming soon. Please contact support for manual returns.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a href={`mailto:${siteConfig.contact.email.orders}?subject=${msg === 'cancel_soon' ? 'Cancel' : 'Return'} Request - Order ${order.order_number}`} className="px-3 py-1.5 bg-white border border-yellow-400 hover:bg-yellow-100 text-yellow-800 rounded-md font-medium text-xs transition-colors text-center whitespace-nowrap">
              Email Us
            </a>
            <Link href="/support" className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white border border-transparent rounded-md font-medium text-xs transition-colors text-center whitespace-nowrap">
              Support
            </Link>
            <Link href={`/order/${id}`} className="absolute top-2 right-2 lg:static p-1 text-yellow-500 hover:text-yellow-800 hover:bg-yellow-200 rounded-md transition-colors" title="Dismiss">
              <X className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-6 md:space-y-8">
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Order Details
              </h1>
              <OrderStatusBadge status={order.status} type="order" className="mt-0.5 md:mt-1" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 mt-2 gap-2 sm:gap-4">
              <p>Ordered on {formatDate(order.created_at)}</p>
              <span className="hidden sm:inline border-l border-gray-300 h-4"></span>
              <p>Order# {order.order_number}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-start md:justify-end gap-3 w-full md:w-auto">
            {!isCancelled && isPaymentPending && (
              <div className="text-sm font-medium text-yellow-800 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-center w-full sm:w-auto">
                Payment is being processed.
              </div>
            )}
            
            {['pending', 'confirmed', 'processing'].includes((order.status || '').toLowerCase()) && (
              <Link href={`/order/${id}?msg=cancel_soon`} className="text-sm px-4 py-2 bg-white hover:bg-red-50 border border-red-300 rounded-md text-red-700 font-medium shadow-sm transition-colors w-full sm:w-auto text-center focus:ring-2 focus:ring-red-500 focus:outline-none block sm:inline-block">
                Cancel Order
              </Link>
            )}

            {(order.status || '').toLowerCase() === 'delivered' && (
              <Link href={`/order/${id}?msg=return_soon`} className="text-sm px-4 py-2 bg-white hover:bg-orange-50 border border-orange-300 rounded-md text-orange-700 font-medium shadow-sm transition-colors w-full sm:w-auto text-center focus:ring-2 focus:ring-orange-500 focus:outline-none block sm:inline-block">
                Return Item
              </Link>
            )}

            <div className="shrink-0 w-full sm:w-auto flex">
              <div className="w-full [&>button]:w-full [&>button]:justify-center">
                <PrintButton orderId={order.id} orderNumber={order.order_number} />
              </div>
            </div>
          </div>
        </div>

        {!isCancelled && !order.status.includes('cancel') && !order.status.includes('return') && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              {order.status === 'delivered' || order.status === 'picked_up' ? (
                <span className="text-[#007185]">{isStorePickup ? 'Picked up on' : 'Delivered on'} {formatDate(order.updated_at || order.created_at)}</span>
              ) : isStorePickup ? (
                <span>Ready for Store Pickup</span>
              ) : (
                <span>Arriving by {formatDate(deliveryDate)}</span>
              )}
            </h2>
            <div className="mt-8">
              <TrackingTimeline 
                status={order.status} 
                isPickup={isStorePickup} 
                courierName={order.courier_name}
                trackingNumber={order.tracking_number}
                trackingUrl={order.tracking_url}
                shippedAt={order.shipped_at}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-3">Billing &amp; Shipping Address</h3>
            <div className="grid gap-2 text-sm text-gray-800">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-500 w-28 shrink-0">Delivery method:</span> 
                <span className="font-medium text-gray-900">{deliveryMethodLabel}</span>
              </div>
              
              {/* 🆕 SAFE ADDRESS DISPLAY WITH FALLBACKS */}
              <div className="flex gap-2">
                <span className="font-semibold text-gray-500 w-28 shrink-0">Name:</span> 
                <span className="font-medium text-gray-900">{customerName}</span>
              </div>
              
              {!isStorePickup ? (
                <>
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-500 w-28 shrink-0">Address:</span> 
                    <span className="font-medium text-gray-900 leading-snug">
                      {customerAddressLine1 !== 'N/A' ? (
                        <>
                          {[customerAddressLine1, customerAddressLine2].filter(Boolean).join(', ')}
                          <br />
                          {customerCity} - {customerPincode}
                          <br />
                          {customerState}, {customerCountry}
                        </>
                      ) : (
                        'Address information will be updated shortly'
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Pincode:</span> 
                  <span className="font-medium text-gray-900">{customerPincode}</span>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <span className="font-semibold text-gray-500 w-28 shrink-0">Mobile number:</span> 
                <span className="text-gray-900">{formatPhoneNumber(customerPhone)}</span>
              </div>

              {customerLandmark && customerLandmark !== 'N/A' && (
                <div className="flex gap-2 mt-1">
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Landmark:</span> 
                  <span className="text-gray-900">{customerLandmark}</span>
                </div>
              )}

              {customerInstructions && customerInstructions !== 'N/A' && (
                <div className="flex gap-2 mt-1">
                  <span className="font-semibold text-gray-500 w-28 shrink-0">Instructions:</span> 
                  <span className="text-gray-900">{customerInstructions}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-3">Payment Method</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p className="capitalize">Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}</p>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <OrderStatusBadge status={order.payment_status} type="payment" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 whitespace-nowrap ml-2">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900 whitespace-nowrap ml-2">
                  {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between gap-2 font-bold pt-3 border-t border-gray-200 mt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900 whitespace-nowrap ml-2">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-900">
            Order Items
          </div>
          <div className="divide-y divide-gray-200">
            {order.order_items.map((item: any, index: number) => {
              let imageUrl = '/placeholder-product.svg'
              const rawImage = item.products?.images?.[0]
              if (rawImage) {
                imageUrl = rawImage.startsWith('http') || rawImage.startsWith('/') || rawImage.startsWith('data:')
                  ? rawImage
                  : getPublicUrl(rawImage)
              }
              
              return (
                <div key={item.id} className="p-6 flex flex-col md:flex-row gap-5 items-start">
                  
                  <div className="flex gap-5 flex-1">
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0">
                      <Image src={imageUrl} fill sizes="(min-width: 768px) 112px, 80px" unoptimized={imageUrl.includes('token=') || imageUrl.includes('supabase')} className="object-contain p-2 mix-blend-multiply" alt={item.products?.name || 'Product'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.products?.slug}`} className="text-base font-bold text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2">
                        {order.order_items.length > 1 ? `${index + 1}. ` : ''}{item.products?.name}
                      </Link>

                      <div className="mt-1">
                        <StarRating rating={item.products?.rating ?? 4.5} reviewCount={item.products?.review_count ?? 128} size="sm" />
                      </div>
                      
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.price)}</span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-xs text-gray-500 line-through whitespace-nowrap">{formatCurrency(item.original_price)}</span>
                        )}
                        <span className="text-xs text-gray-600 ml-1">Qty: <span className="font-medium text-gray-900">{item.quantity}</span></span>
                      </div>

                      {item.printing_type && item.printing_type !== 'None' && (
                        <div className="mt-2.5 pl-3 border-l-2 border-[#007185] text-xs">
                          <p className="font-bold text-[#007185] flex items-center gap-1.5 uppercase tracking-wide">
                            <Package className="w-3.5 h-3.5" /> {item.printing_type}
                            {item.artwork_urls && item.artwork_urls.length > 0 && (
                              <span className="ml-1 text-gray-600 normal-case tracking-normal font-medium">[{item.artwork_urls.length} File(s) Attached]</span>
                            )}
                          </p>
                          {item.printing_instructions && (
                            <p className="text-gray-600 italic mt-0.5">Note: &quot;{item.printing_instructions}&quot;</p>
                          )}
                          
                          {item.signed_artwork_urls && item.signed_artwork_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.signed_artwork_urls.map((url: string, idx: number) => (
                                <ArtworkDownloadButton key={idx} url={url} index={idx} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {item.products?.description && (
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2">{item.products.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 shrink-0 md:ml-4 w-full md:w-48 mt-2 md:mt-0">
                    <div className="text-sm font-bold text-gray-900 whitespace-nowrap text-center w-full">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <Link href={`/product/${item.products?.slug}`} className="w-full py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full text-sm font-bold text-[#0F1111] transition-colors shadow-sm text-center">
                      Buy it again
                    </Link>
                    
                    <div className="flex justify-center w-full pt-1">
                      <ProductWishlistButton productId={item.products?.id} />
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Container>
    </div>
  )
}