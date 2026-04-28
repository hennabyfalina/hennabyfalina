// src/app/(shop)/profile/orders/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Container from '@/components/ui/Container'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency, formatDate, numberToIndianWords } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import InvoiceLink from '@/components/order/InvoiceLink'
import RetryPaymentButton from '@/components/order/RetryPaymentButton'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { siteConfig } from '@/config/site'
import { X } from 'lucide-react'

export const metadata = {
  title: `Your Orders | ${siteConfig.name}`
}

interface OrdersPageProps {
  searchParams: Promise<{ filter?: string; msg?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login?redirect=/orders')
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

  if (filter === 'unshipped') {
    // Exclude failed payments from unshipped
    query = query.in('status', ['pending', 'processing']).eq('payment_status', 'paid')
  } else if (filter === 'cancelled') {
    query = query.in('status', ['cancelled', 'cancel_requested'])
  } else if (filter === 'buy-again') {
    query = query.eq('status', 'delivered')
  } else if (filter === 'failed') {
    query = query.in('payment_status', ['failed', 'pending'])
  } else if (filter === 'all') {
    // Only show successfully paid orders in the default 'Orders' tab
    query = query.eq('payment_status', 'paid')
  }

  const { data: orders, error } = await query

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Your Orders</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-6 tracking-tight">Your Orders</h1>

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
              <a href={`mailto:${siteConfig.contact.email.orders}?subject=${msg === 'cancel_soon' ? 'Cancel' : 'Return'} Order Request`} className="px-3 py-1.5 bg-white border border-yellow-400 hover:bg-yellow-100 text-yellow-800 rounded-md font-medium text-xs transition-colors text-center whitespace-nowrap">
                Email Us
              </a>
              <Link href="/support" className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white border border-transparent rounded-md font-medium text-xs transition-colors text-center whitespace-nowrap">
                Support
              </Link>
              <Link href={`/profile/orders?filter=${filter}`} className="absolute top-2 right-2 lg:static p-1 text-yellow-500 hover:text-yellow-800 hover:bg-yellow-200 rounded-md transition-colors" title="Dismiss">
                <X className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 mb-6 gap-6 text-sm font-medium pb-1">
          <Link href="/profile/orders" className={`whitespace-nowrap pb-2 border-b-2 ${filter === 'all' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Orders
          </Link>
          <Link href="/profile/orders?filter=buy-again" className={`whitespace-nowrap pb-2 border-b-2 ${filter === 'buy-again' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Buy Again
          </Link>
          <Link href="/profile/orders?filter=unshipped" className={`whitespace-nowrap hidden sm:block pb-2 border-b-2 ${filter === 'unshipped' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Not Yet Shipped
          </Link>
          <Link href="/profile/orders?filter=cancelled" className={`whitespace-nowrap pb-2 border-b-2 ${filter === 'cancelled' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Cancelled Orders
          </Link>
          <Link href="/profile/orders?filter=failed" className={`whitespace-nowrap pb-2 border-b-2 ${filter === 'failed' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Pending & Failed
          </Link>
        </div>

        {/* Orders List */}
        {(!orders || orders.length === 0) ? (
          <div className="py-8 text-center text-gray-600">
            {filter === 'cancelled' && 'You have no cancelled orders.'}
            {filter === 'unshipped' && 'You have no pending or unshipped orders.'}
            {filter === 'buy-again' && 'You do not have any delivered orders to buy again.'}
            {filter === 'failed' && 'You have no failed or pending payments.'}
            {filter === 'all' && 'You have not placed any orders yet.'}
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {

              const isStorePickup = order.shipping_method === 'pickup' || 
                                    order.delivery_method === 'pickup' || 
                                    order.addresses?.delivery_method === 'pickup' || 
                                    (order.addresses?.address_line1 || '').toLowerCase().includes('pickup') || 
                                    (order.addresses?.address || '').toLowerCase().includes('pickup')

              return (
                <div key={order.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  
                {/* Order Header */}
                <div className="bg-[#F0F2F2] px-4 md:px-5 py-3 border-b border-gray-300 text-sm text-gray-600 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 md:gap-12 w-full sm:w-auto">
                    <div>
                      <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-0.5 sm:mb-1">Order Placed</div>
                      <div className="text-gray-900">{formatDate(order.created_at)}</div>
                    </div>
                    <div>
                      <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-0.5 sm:mb-1">Total</div>
                      <div className="text-gray-900 font-medium whitespace-nowrap">{formatCurrency(order.total_amount)}</div>
                      {order.total_amount > 0 && (
                        <div className="text-[10px] text-gray-500 italic mt-0.5 leading-tight w-full sm:max-w-[150px] line-clamp-2 sm:line-clamp-none">
                          {numberToIndianWords(order.total_amount)}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-1">Ship To</div>
                      <div className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer truncate max-w-[120px] lg:max-w-[200px]">
                        {order.addresses?.name || user.user_metadata?.name || user.email?.split('@')[0]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right w-full sm:w-auto flex flex-col sm:items-end border-t border-gray-200 sm:border-0 pt-2 sm:pt-0">
                    <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-0.5 sm:mb-1">Order # {order.order_number}</div>
                    {order.payment_status === 'paid' && (
                      <div className="flex gap-2 justify-start sm:justify-end mt-1 text-[#007185]">
                        <Link href={`/order/${order.id}`} className="hover:text-[#C7511F] hover:underline">
                          View order details
                        </Link>
                        <span className="text-gray-300">|</span>
                        <InvoiceLink orderId={order.id} orderNumber={order.order_number} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-4 md:p-5 bg-white">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 flex-wrap">
                    {order.status === 'delivered' ? (
                      <span className="text-gray-900">Delivered {formatDate(order.updated_at || order.created_at)}</span>
                    ) : order.payment_status === 'failed' ? (
                      <span className="text-gray-900">Payment Failed</span>
                    ) : order.payment_status === 'pending' ? (
                      <span className="text-gray-900">Awaiting Payment</span>
                    ) : order.status.includes('cancel') ? (
                      <span className="text-gray-900">Cancelled</span>
                    ) : isStorePickup ? (
                      <span className="text-gray-900">Store Pickup Order</span>
                    ) : (
                      <span>Arriving by {formatDate(new Date(new Date(order.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString())}</span>
                    )}
                    <OrderStatusBadge status={order.status} type="order" />
                    {order.status !== order.payment_status && (
                      <OrderStatusBadge status={order.payment_status} type="payment" />
                    )}
                  </h3>

                  {order.payment_status === 'failed' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                      <span className="font-bold">Reason:</span> {order.payment_failed_reason || 'Transaction could not be completed.'}
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {order.order_items.map((item: any, itemIndex: number) => {
                      let imageUrl = '/placeholder-product.svg'
                      const rawImage = item.products?.images?.[0]

                      if (rawImage) {
                        imageUrl = rawImage.startsWith('http') || rawImage.startsWith('/') || rawImage.startsWith('data:')
                          ? rawImage
                          : getPublicUrl(rawImage)
                      }

                      return (
                        <div key={item.id} className="flex flex-col md:flex-row gap-4 sm:gap-6">
                          
                          {/* Left Side: Product Info */}
                          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                            <Link href={`/product/${item.products?.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 relative bg-gray-50 border border-gray-200 rounded-sm overflow-hidden shrink-0">
                              <Image 
                                src={imageUrl}
                                fill 
                                sizes="96px"
                                priority={itemIndex === 0} // Fixes lazy loading intervention warning
                                unoptimized={imageUrl.includes('token=') || imageUrl.includes('supabase')}
                                className="object-contain mix-blend-multiply p-1" 
                                alt={item.products?.name || 'Product Image'} 
                              />
                            </Link>
                            
                            <div className="flex-1">
                              <Link href={`/product/${item.products?.slug}`} className="text-sm md:text-base font-bold text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2">
                                {item.products?.name}
                              </Link>
                              
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.price)}</span>
                                {item.original_price && item.original_price > item.price && (
                                  <span className="text-xs text-gray-500 line-through whitespace-nowrap">{formatCurrency(item.original_price)}</span>
                                )}
                                {item.is_bulk_pricing && (
                                  <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-sm">Bulk Price Applied</span>
                                )}
                                <span className="text-xs text-gray-600 ml-1">Qty: {item.quantity}</span>
                              </div>

                              {item.products?.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.products.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Actions Stack */}
                          <div className="mt-2 md:mt-0 flex flex-col gap-2 w-full md:w-56 shrink-0">
                            {order.payment_status === 'paid' && (
                              <Link href={`/order/${order.id}`} className="px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                                Track package
                              </Link>
                            )}
                            
                            {/* Dynamic Cancel Order Button */}
                            {['pending', 'confirmed', 'processing'].includes((order.status || '').toLowerCase()) && order.payment_status === 'paid' && (
                              <Link href={`/profile/orders?filter=${filter}&msg=cancel_soon`} className="px-4 py-2 bg-white hover:bg-red-50 border border-red-300 rounded-xl text-sm font-medium text-red-700 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-red-500 focus:outline-none block">
                                Cancel Order
                              </Link>
                            )}

                            {/* Dynamic Return Item Button */}
                            {(order.status || '').toLowerCase() === 'delivered' && (
                              <Link href={`/profile/orders?filter=${filter}&msg=return_soon`} className="px-4 py-2 bg-white hover:bg-orange-50 border border-orange-300 rounded-xl text-sm font-medium text-orange-700 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-orange-500 focus:outline-none block">
                                Return Item
                              </Link>
                            )}

                            {/* Dynamic Retry Payment Button */}
                            {['failed', 'pending'].includes(order.payment_status) && (
                              <RetryPaymentButton
                                orderId={order.id}
                                orderNumber={order.order_number}
                                amount={order.total_amount}
                              />
                            )}

                            <Link href={`/product/${item.products?.slug}`} className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                              Buy it again
                            </Link>
                            <Link href={`/product/${item.products?.slug}`} className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                              Write a product review
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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