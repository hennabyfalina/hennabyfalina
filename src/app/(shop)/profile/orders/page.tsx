// src/app/(shop)/profile/orders/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Container from '@/components/ui/Container'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import InvoiceLink from '@/components/order/InvoiceLink'
import RetryPaymentButton from '@/components/order/RetryPaymentButton'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import ProductWishlistButton from '@/components/product/ProductWishlistButton'
import StarRating from '@/components/product/StarRating'
import { siteConfig } from '@/config/site'
import { X, ChevronRight, ArrowUpRight, ShoppingBag } from 'lucide-react'

export const metadata = {
  title: `Your Orders | ${siteConfig.name} Studio`
}

interface OrdersPageProps {
  searchParams: Promise<{ filter?: string; msg?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login?next=/profile/orders')
  }

  const resolvedParams = await searchParams
  const filter = resolvedParams?.filter || 'all'
  const msg = resolvedParams?.msg

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
    .order('created_at', { ascending: false })

  if (filter === 'unshipped') query = query.in('status', ['pending', 'processing']).eq('payment_status', 'paid')
  else if (filter === 'cancelled') query = query.in('status', ['cancelled', 'cancel_requested'])
  else if (filter === 'buy-again') query = query.eq('status', 'delivered')
  else if (filter === 'failed') query = query.in('payment_status', ['failed', 'pending'])
  else if (filter === 'all') query = query.eq('payment_status', 'paid')

  const { data: orders } = await query

  return (
    <div className="min-h-screen bg-white py-8 md:py-16 font-sans antialiased select-none text-left">
      <Container className="max-w-[1100px] px-4 sm:px-8">
        
        {/* Breadcrumb Navigation - Left-Aligned Minimalist Monochrome Strings */}
        <div className="text-[15px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1 w-fit">
          <Link href="/profile">Profile</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Your Orders</span>
        </div>
        
        {/* Left-Aligned Premium Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">Your Orders</h1>
          <p className="text-[14px] text-gray-400 font-normal mt-1.5 normal max-w-xl">
            Review past transactions, coordinate shipment processing tracking etc.
          </p>
        </div>

        {/* Action Context Banner Alerts */}
        {(msg === 'cancel_soon' || msg === 'return_soon') && (
          <div className="mb-10 p-4 bg-stone-50 rounded-2xl text-[14px] font-medium text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative pr-10 sm:pr-4 animate-fade-in border border-stone-100/50">
            <p className="capitalize">
              {msg === 'cancel_soon' ? 'Automated cancellations are currently disabled. Please contact support.' : 'Automated returns are currently disabled. Please contact support.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a href={`mailto:${siteConfig.contact.email.orders}?subject=${msg === 'cancel_soon' ? 'Cancel' : 'Return'} Order Request`} className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-900 text-gray-900 rounded-xl transition-colors text-xs font-semibold capitalize whitespace-nowrap">Email Support</a>
              <Link href="/support" className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-gray-900 rounded-xl font-semibold text-xs transition-colors text-center whitespace-nowrap capitalize">Support</Link>
              <Link href={`/profile/orders?filter=${filter}`} className="absolute top-2 right-2 sm:static p-1 text-gray-400 hover:text-gray-900 transition-colors" title="Dismiss"><X className="w-4 h-4" /></Link>
            </div>
          </div>
        )}

        {/* Filter Navigation Tabs Row */}
        <div className="flex overflow-x-auto overscroll-contain no-scrollbar border-b border-gray-100 mb-12 gap-7 text-[14px] font-semibold pb-0.5 capitalize">
          <Link href="/profile/orders" className={`whitespace-nowrap pb-3 border-b-2 transition-colors duration-150 ${filter === 'all' ? 'text-gray-900 border-black font-bold' : 'text-gray-400 border-transparent hover:text-gray-900'}`}>Orders</Link>
          <Link href="/profile/orders?filter=buy-again" className={`whitespace-nowrap pb-3 border-b-2 transition-colors duration-150 ${filter === 'buy-again' ? 'text-gray-900 border-black font-bold' : 'text-gray-400 border-transparent hover:text-gray-900'}`}>Buy Again</Link>
          <Link href="/profile/orders?filter=unshipped" className={`whitespace-nowrap hidden sm:block pb-3 border-b-2 transition-colors duration-150 ${filter === 'unshipped' ? 'text-gray-900 border-black font-bold' : 'text-gray-400 border-transparent hover:text-gray-900'}`}>Not Yet Shipped</Link>
          <Link href="/profile/orders?filter=cancelled" className={`whitespace-nowrap pb-3 border-b-2 transition-colors duration-150 ${filter === 'cancelled' ? 'text-gray-900 border-black font-bold' : 'text-gray-400 border-transparent hover:text-gray-900'}`}>Cancelled Orders</Link>
          <Link href="/profile/orders?filter=failed" className={`whitespace-nowrap pb-3 border-b-2 transition-colors duration-150 ${filter === 'failed' ? 'text-gray-900 border-black font-bold' : 'text-gray-400 border-transparent hover:text-gray-900'}`}>Pending & Failed</Link>
        </div>

        {/* Empty States Handling */}
        {(!orders || orders.length === 0) ? (
          <div className="py-20 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="w-15 h-15 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <ShoppingBag className="w-10 h-10" strokeWidth={1.5} />
            </div>
            <p className="text-gray-400 font-normal text-[18px] normal leading-relaxed">
              {filter === 'cancelled' && 'You have no cancelled orders.'}
              {filter === 'unshipped' && 'You have no pending or unshipped orders.'}
              {filter === 'buy-again' && 'You do not have any delivered orders to buy again.'}
              {filter === 'failed' && 'You have no failed or pending payments.'}
              {filter === 'all' && 'You have not placed any orders yet.'}
            </p>
          </div>
        ) : (
          /* AUTHENTIC APPLE LEVEL BORDERLESS TIMELINE TRACK */
          <div className="space-y-16">
            {orders.map((order) => {

              const isStorePickup = order.shipping_method === 'pickup' || 
                                    order.delivery_method === 'pickup' || 
                                    order.addresses?.delivery_method === 'pickup' || 
                                    (order.addresses?.address_line1 || '').toLowerCase().includes('pickup') || 
                                    (order.addresses?.address || '').toLowerCase().includes('pickup') ||
                                    (order.pickup_contact && Object.keys(order.pickup_contact).length > 0)

              const getAddressField = (field: string, fallback: string = 'N/A') => {
                if (order.addresses && order.addresses[field]) return order.addresses[field]
                if (order.pending_address && order.pending_address[field]) return order.pending_address[field]
                if (isStorePickup && order.pickup_contact && order.pickup_contact[field]) return order.pickup_contact[field]
                return fallback
              }

              const customerName = getAddressField('name', user.user_metadata?.name || user.email?.split('@')[0])

              return (
                <div key={order.id} className="group border-b border-stone-100 pb-12 last:border-0 last:pb-0 flex flex-col w-full text-left">
                  
                  {/* Top Typographic Strip - Replaces the old Box Header bar completely */}
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-gray-400 font-medium">
                      <div>
                        <span className="text-gray-400 mr-1.5 font-normal capitalize">Date:</span>
                        <span className="text-gray-900 font-semibold">{formatDate(order.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 mr-1.5 font-normal capitalize">Total:</span>
                        <span className="text-gray-900 font-bold">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 mr-1.5 font-normal capitalize">Order reference:</span>
                        <span className="text-gray-900 font-semibold tracking-wide">#{order.order_number}</span>
                      </div>
                      
                      {/* Premium Dynamic Popover for Address Details */}
                      <div className="relative group/addr cursor-pointer">
                        <span className="text-gray-400 mr-1.5 font-normal capitalize">Ship to:</span>
                        <span className="text-gray-900 font-bold underline underline-offset-4 decoration-stone-200 group-hover/addr:text-stone-600 transition-colors inline-flex items-center gap-0.5">
                          {customerName.split(' ')[0]}
                        </span>
                        
                        <div className="absolute top-[calc(100%+6px)] left-0 bg-white border border-gray-100 shadow-2xl rounded-2xl opacity-0 invisible group-hover/addr:opacity-100 group-hover/addr:visible transition-all duration-200 z-50 p-5 text-[14px] text-gray-900 w-60 normal-case pointer-events-none group-hover/addr:pointer-events-auto">
                          <div className="font-bold text-gray-950 mb-1.5 capitalize">{customerName}</div>
                          {isStorePickup ? (
                            <div className="space-y-1 font-medium text-gray-400 text-[13px] capitalize">
                              <p className="font-bold text-gray-900">Home Studio Pickup</p>
                              <p>Pincode: {getAddressField('pincode')}</p>
                              <p className="pt-0.5 text-gray-500 font-semibold">Phone: {getAddressField('phone')}</p>
                            </div>
                          ) : order.addresses ? (
                            <div className="space-y-1 text-gray-400 font-medium text-[13px] leading-normal capitalize">
                              <p>{order.addresses.address_line1}</p>
                              {order.addresses.address_line2 && <p>{order.addresses.address_line2}</p>}
                              <p>{order.addresses.city}, {order.addresses.state} {order.addresses.pincode}</p>
                              {order.addresses.phone && <p className="pt-0.5 text-gray-500 font-semibold">Phone: {order.addresses.phone}</p>}
                            </div>
                          ) : (
                            <div className="text-gray-300 italic text-[13px]">No address details available</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Access Details Navigation Anchor */}
                    <div className="flex items-center gap-4 text-[13px] font-semibold text-gray-900 shrink-0">
                      {order.payment_status === 'paid' && (
                        <Link href={`/order/${order.id}`} className="hover:text-gray-500 transition-colors inline-flex items-center gap-0.5 capitalize">
                          <span>Manage parameters</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                        </Link>
                      )}
                      {order.payment_status === 'paid' && (
                        <div className="flex items-center gap-4">
                          <span className="text-gray-200">|</span>
                          <InvoiceLink orderId={order.id} orderNumber={order.order_number} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Status Timeline Alert Layer */}
                  <div className="flex items-center gap-3 mb-6 flex-wrap bg-stone-50/40 border border-stone-100/40 rounded-2xl px-4 py-3">
                    <h3 className="text-[14px] sm:text-[15px] font-normal text-gray-950 tracking-tight capitalize">
                      {order.status === 'delivered' ? (
                        <span>Delivered On {formatDate(order.updated_at || order.created_at)}</span>
                      ) : order.payment_status === 'failed' ? (
                        <span>Transaction Unsuccessful</span>
                      ) : order.payment_status === 'pending' ? (
                        <span>Awaiting Gateway Clearance</span>
                      ) : order.status.includes('cancel') ? (
                        <span>Order Cancelled</span>
                      ) : isStorePickup ? (
                        <span>Ready For Studio Pickup</span>
                      ) : (
                        <span>Estimated Arrival: {formatDate(order.estimated_delivery_date || new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())}</span>
                      )}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} type="order" className="shadow-none" />
                      {order.status !== order.payment_status && (
                        <OrderStatusBadge status={order.payment_status} type="payment" className="shadow-none" />
                      )}
                    </div>
                  </div>

                  {/* Operational Failure Log Alerts */}
                  {order.payment_status === 'failed' && (
                    <div className="mb-6 p-4 bg-stone-50 border border-stone-100 rounded-2xl text-[13px] text-red-700 font-medium capitalize">
                      <span className="font-bold mr-1 text-red-900">Failure log summary:</span> {order.payment_failed_reason || 'Transaction declined by issuer network routing filters.'}
                    </div>
                  )}
                  
                  {/* Clean Item Matrix Stream */}
                  <div className="space-y-6 w-full">
                    {order.order_items.map((item: any, itemIndex: number) => {
                      let imageUrl = '/placeholder-product.svg'
                      const rawImage = item.products?.images?.[0]
                      if (rawImage) {
                        imageUrl = rawImage.startsWith('http') || rawImage.startsWith('/') || rawImage.startsWith('data:')
                          ? rawImage
                          : getPublicUrl(rawImage)
                      }

                      return (
                        <div key={item.id} className="flex flex-col md:flex-row gap-6 items-start justify-between w-full">
                          
                          {/* Image box and contextual summary grid text attributes */}
                          <div className="flex gap-5 flex-1 min-w-0 w-full text-left">
                            <Link href={`/product/${item.products?.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 relative bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-2 transition-transform duration-300 active:scale-98">
                              <Image src={imageUrl} fill sizes="(max-width: 640px) 80px, 96px" priority={itemIndex === 0} unoptimized={imageUrl.includes('token=')} className="object-contain mix-blend-multiply p-1" alt={item.products?.name || 'Product Image'} />
                            </Link>
                            
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center gap-3">
                                <Link href={`/product/${item.products?.slug}`} className="text-[15px] sm:text-[16px] font-bold text-gray-900 hover:text-stone-500 transition-colors line-clamp-2 capitalize tracking-tight leading-snug shrink-0">
                                  {item.products?.name}
                                </Link>
                                <ProductWishlistButton productId={item.products?.id} showText={false} />
                              </div>

                              <div className="mt-1.5 flex items-center">
                                <StarRating rating={item.products?.rating ?? 4.5} reviewCount={item.products?.review_count ?? 128} size="sm" />
                              </div>
                              
                              {/* Pricing Metrics Structure */}
                              <div className="flex items-baseline gap-2.5 mt-2.5">
                                <span className="text-[14px] sm:text-[15px] font-bold text-gray-950">{formatCurrency(item.price)}</span>
                                {item.original_price && item.original_price > item.price && (
                                  <span className="text-[12px] text-gray-400 line-through font-medium">{formatCurrency(item.original_price)}</span>
                                )}
                                <span className="text-stone-200 text-xs px-0.5">|</span>
                                <span className="text-[13px] text-gray-400 font-semibold capitalize">Quantity: {item.quantity}</span>
                              </div>

                              {item.products?.description && (
                                <p className="text-[13px] text-gray-400 font-medium mt-2 line-clamp-1 capitalize">{item.products.description}</p>
                              )}
                            </div>
                          </div>

                          {/* 🚀 FIXED: Upgraded core action cluster container grid. 
                              On mobile viewports it splits beautifully into a balanced 2-column track layout side-by-side. 
                              On desktop viewports it instantly snaps back into a highly disciplined vertical sidebar. */}
                          <div className="grid grid-cols-2 md:flex md:flex-col gap-2.5 w-full md:w-48 shrink-0 pt-0.5 items-center md:items-end justify-start">
                            
                            {/* Primary Target Button Action Triggers (Track Package) */}
                            {order.payment_status === 'paid' && (
                              <Link href={`/order/${order.id}`} className="h-10 px-4 bg-black hover:bg-stone-900 text-white font-semibold rounded-full text-[13px] transition-colors flex items-center justify-center capitalize w-full shadow-none text-center">
                                Track Package
                              </Link>
                            )}

                            {/* Payment State Failovers (Upgraded from Amazon Yellow to Curved Black Pill) */}
                            {['failed', 'pending'].includes(order.payment_status) && (
                              <div className="w-full">
                                <RetryPaymentButton orderId={order.id} orderNumber={order.order_number} amount={order.total_amount} />
                              </div>
                            )}

                            {/* Secondary Cancellations and Return Handles */}
                            {['pending', 'confirmed', 'processing'].includes((order.status || '').toLowerCase()) && order.payment_status === 'paid' && (
                              <Link href={`/profile/orders?filter=${filter}&msg=cancel_soon`} className="h-10 px-4 bg-white border border-stone-200 hover:border-gray-900 text-gray-600 font-semibold rounded-full text-[13px] transition-colors flex items-center justify-center capitalize w-full text-center">
                                Cancel Item
                              </Link>
                            )}

                            {(order.status || '').toLowerCase() === 'delivered' && (
                              <Link href={`/profile/orders?filter=${filter}&msg=return_soon`} className="h-10 px-4 bg-white border border-stone-200 hover:border-gray-900 text-gray-600 font-semibold rounded-full text-[13px] transition-colors flex items-center justify-center capitalize w-full text-center">
                                Return Item
                              </Link>
                            )}

                            {/* Secondary Reorder Trigger Pill */}
                            <Link href={`/product/${item.products?.slug}`} className="h-10 px-4 bg-stone-50 border border-transparent hover:border-stone-200 text-gray-900 font-semibold rounded-full text-[13px] transition-colors flex items-center justify-center capitalize w-full text-center">
                              Buy It Again
                            </Link>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}