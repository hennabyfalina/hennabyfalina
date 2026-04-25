// src/app/(shop)/profile/orders/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Container from '@/components/ui/Container'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import InvoiceLink from '@/components/order/InvoiceLink'
import RetryPaymentButton from '@/components/order/RetryPaymentButton'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Your Orders | ${siteConfig.name}`
}

async function cancelOrderAction(orderId: string) {
  'use server'
  const supabaseServer = await createClient()
  await supabaseServer.from('orders').update({ status: 'cancel_requested' }).eq('id', orderId)
  revalidatePath('/profile/orders')
}

async function returnOrderAction(orderId: string) {
  'use server'
  const supabaseServer = await createClient()
  await supabaseServer.from('orders').update({ status: 'return_requested' }).eq('id', orderId)
  revalidatePath('/profile/orders')
}

interface OrdersPageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login?redirect=/orders')
  }

  const resolvedParams = await searchParams
  const filter = resolvedParams?.filter || 'all'

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

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-6 text-sm font-medium">
          <Link href="/profile/orders" className={`pb-2 border-b-2 ${filter === 'all' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Orders
          </Link>
          <Link href="/profile/orders?filter=buy-again" className={`pb-2 border-b-2 ${filter === 'buy-again' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Buy Again
          </Link>
          <Link href="/profile/orders?filter=unshipped" className={`hidden sm:block pb-2 border-b-2 ${filter === 'unshipped' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Not Yet Shipped
          </Link>
          <Link href="/profile/orders?filter=cancelled" className={`pb-2 border-b-2 ${filter === 'cancelled' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
            Cancelled Orders
          </Link>
          <Link href="/profile/orders?filter=failed" className={`pb-2 border-b-2 ${filter === 'failed' ? 'text-gray-900 border-[#e77600] font-bold' : 'text-[#007185] border-transparent hover:text-[#C7511F] hover:underline'}`}>
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
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                
                {/* Order Header */}
                <div className="bg-[#F0F2F2] px-4 md:px-5 py-3 border-b border-gray-300 text-sm text-gray-600 flex flex-wrap md:flex-nowrap justify-between gap-4">
                  <div className="flex flex-wrap gap-6 md:gap-12 w-full md:w-auto">
                    <div>
                      <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-1">Order Placed</div>
                      <div className="text-gray-900">{formatDate(order.created_at)}</div>
                    </div>
                    <div>
                      <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-1">Total</div>
                      <div className="text-gray-900">{formatCurrency(order.total_amount)}</div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-1">Ship To</div>
                      <div className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
                        {order.addresses?.name || user.user_metadata?.name || user.email?.split('@')[0]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left md:text-right w-full md:w-auto flex flex-col md:items-end">
                    <div className="uppercase text-[11px] md:text-xs text-gray-500 mb-1">Order # {order.order_number}</div>
                    {order.payment_status === 'paid' && (
                      <div className="flex gap-2 justify-start md:justify-end mt-1 text-[#007185]">
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
                      <span className="text-green-700">Delivered {formatDate(order.updated_at || order.created_at)}</span>
                    ) : order.payment_status === 'failed' ? (
                      <span className="text-red-700">Payment Failed</span>
                    ) : order.payment_status === 'pending' ? (
                      <span className="text-amber-600">Awaiting Payment</span>
                    ) : order.status.includes('cancel') ? (
                      <span className="text-red-700">Cancelled</span>
                    ) : (
                      <span>Arriving by {formatDate(new Date(new Date(order.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString())}</span>
                    )}
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                      {order.payment_status === 'failed' ? 'Payment Failed' : order.payment_status === 'pending' ? 'Pending Payment' : order.status === 'pending' ? 'Preparing for Shipment' : order.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
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
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price)}</span>
                                {item.original_price && item.original_price > item.price && (
                                  <span className="text-xs text-gray-500 line-through">{formatCurrency(item.original_price)}</span>
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
                              <form action={cancelOrderAction.bind(null, order.id)}>
                                <button type="submit" className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                                  Cancel Order
                                </button>
                              </form>
                            )}

                            {/* Dynamic Return Item Button */}
                            {(order.status || '').toLowerCase() === 'delivered' && (
                              <form action={returnOrderAction.bind(null, order.id)}>
                                <button type="submit" className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                                  Return Item
                                </button>
                              </form>
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
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}