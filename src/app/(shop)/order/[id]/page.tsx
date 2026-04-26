// src/app/(shop)/order/[id]/page.tsx

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/ui/Container'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { ChevronLeft } from 'lucide-react'
import PrintButton from '@/components/order/PrintButton'
import TrackingTimeline from '@/components/order/TrackingTimeline'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { revalidatePath } from 'next/cache'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

async function cancelOrderAction(orderId: string) {
  'use server'
  const supabaseServer = await createClient()
  await supabaseServer.from('orders').update({ status: 'cancel_requested' }).eq('id', orderId)
  revalidatePath(`/order/${orderId}`)
  revalidatePath('/profile/orders')
}

async function returnOrderAction(orderId: string) {
  'use server'
  const supabaseServer = await createClient()
  await supabaseServer.from('orders').update({ status: 'return_requested' }).eq('id', orderId)
  revalidatePath(`/order/${orderId}`)
  revalidatePath('/profile/orders')
}

export default async function OrderPage({ params }: OrderPageProps) {
  const supabase = await createClient()
  const { id } = await params
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    notFound()
  }

  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      addresses (*),
      order_items (
        *,
        products (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    notFound()
  }

  // Security check: only allow viewing details for paid orders
  if (order.payment_status !== 'paid') {
    redirect('/profile/orders?filter=failed')
  }

  const isPaymentPending = order.payment_status === 'pending'
  const isCancelled = order.status === 'cancelled'

  // Fallback for older orders without shipping_cost saved directly
  const shippingCost = order.shipping_cost ?? (order.total_amount > 1000 ? 0 : 50)
  const subtotal = order.total_amount - shippingCost

  // Address Formatting Logic
  const isStorePickup = order.delivery_method === 'pickup' || 
                        order.addresses?.delivery_method === 'pickup' ||
                        order.addresses?.address_line1?.toLowerCase().includes('pickup') || 
                        order.addresses?.address?.toLowerCase().includes('pickup')
  const deliveryMethodLabel = isStorePickup ? 'Store Pickup' : 'Standard Delivery'

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
    return phone
  }

  const deliveryDate = new Date(new Date(order.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()

  return (
    <Container className="py-8 md:py-12 max-w-5xl">
      {/* Top Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile/orders" className="text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      {/* Website View */}
      <div className="space-y-6 md:space-y-8">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-200 pb-6">
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
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-start md:justify-end gap-3 mt-4 md:mt-0 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-lg border border-gray-200 md:border-none w-full md:w-auto">
            {!isCancelled && isPaymentPending && (
              <div className="text-sm font-medium text-yellow-800 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-center w-full sm:w-auto">
                Payment is being processed.
              </div>
            )}
            
            {/* Dynamic Cancel Order Button */}
            {['pending', 'confirmed', 'processing'].includes((order.status || '').toLowerCase()) && (
              <form action={cancelOrderAction.bind(null, order.id)} className="w-full sm:w-auto">
                <button type="submit" className="text-sm px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium shadow-sm transition-colors w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                  Cancel Order
                </button>
              </form>
            )}

            {/* Dynamic Return Item Button */}
            {(order.status || '').toLowerCase() === 'delivered' && (
              <form action={returnOrderAction.bind(null, order.id)} className="w-full sm:w-auto">
                <button type="submit" className="text-sm px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium shadow-sm transition-colors w-full focus:ring-2 focus:ring-[#007185] focus:outline-none">
                  Return Item
                </button>
              </form>
            )}

            <div className="shrink-0 w-full sm:w-auto flex">
              <div className="w-full [&>button]:w-full [&>button]:justify-center">
                <PrintButton orderId={order.id} orderNumber={order.order_number} />
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        {!isCancelled && !order.status.includes('cancel') && !order.status.includes('return') && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {order.status === 'delivered' || order.status === 'picked_up' ? (
                <span className="text-[#007185]">{isStorePickup ? 'Picked up on' : 'Delivered on'} {formatDate(order.updated_at || order.created_at)}</span>
              ) : isStorePickup ? (
                <span>Ready for Store Pickup</span>
              ) : (
                <span>Arriving by {formatDate(deliveryDate)}</span>
              )}
            </h2>
            
            <div className="mt-8">
              <TrackingTimeline status={order.status} isPickup={isStorePickup} />
            </div>
          </div>
        )}

        {/* Order Info Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Billing & Shipping Address</h3>
            <div className="grid gap-2 text-sm text-gray-800">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-500 w-32 shrink-0">Delivery method:</span> 
                <span className="font-medium text-gray-900">{deliveryMethodLabel}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-500 w-32 shrink-0">Name:</span> 
                <span className="font-medium text-gray-900">{order.addresses.name}</span>
              </div>
              {!isStorePickup ? (
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-32 shrink-0">Address & Pincode:</span> 
                  <span className="font-medium text-gray-900">{order.addresses.address || order.addresses.address_line1}, {order.addresses.city} {order.addresses.pincode}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-32 shrink-0">Pincode:</span> 
                  <span className="font-medium text-gray-900">{order.addresses.pincode}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-semibold text-gray-500 w-32 shrink-0">Country:</span> 
                <span className="font-medium text-gray-900">{order.addresses.country || 'India'}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="font-semibold text-gray-500 w-32 shrink-0">Mobile number:</span> 
                <span className="text-gray-900">{formatPhoneNumber(order.addresses?.phone)}</span>
              </div>
              {order.addresses.landmark && (
                <div className="flex gap-2 border-t border-gray-100 pt-2 mt-2">
                  <span className="font-semibold text-gray-500 w-32 shrink-0">Landmark:</span> 
                  <span className="font-medium text-gray-900">{order.addresses.landmark}</span>
                </div>
              )}
              {order.addresses.delivery_instructions && (
                <div className="flex gap-2 pt-1 mt-1">
                  <span className="font-semibold text-gray-500 w-32 shrink-0">Instructions:</span> 
                  <span className="font-medium text-gray-900">{order.addresses.delivery_instructions}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p className="capitalize">Razorpay {order.payment_method_detail || order.payment_method || 'Standard'}</p>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <OrderStatusBadge status={order.payment_status} type="payment" />
            </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
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
              <div className="flex justify-between gap-2 font-bold pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900 whitespace-nowrap ml-2">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 font-bold text-gray-900">
            Order Items
          </div>
          <div className="divide-y divide-gray-200">
            {order.order_items.map((item: any) => {
              let imageUrl = '/placeholder-product.svg'
              const rawImage = item.products?.images?.[0]

              if (rawImage) {
                imageUrl = rawImage.startsWith('http') || rawImage.startsWith('/') || rawImage.startsWith('data:')
                  ? rawImage
                  : getPublicUrl(rawImage)
              }

              return (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-md bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                    <Image 
                      src={imageUrl}
                      fill 
                      sizes="80px"
                      unoptimized={imageUrl.includes('token=') || imageUrl.includes('supabase')}
                      className="object-contain p-1 mix-blend-multiply" 
                      alt={item.products?.name || 'Product'} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.products?.slug}`} className="text-sm md:text-base font-medium text-[#007185] hover:text-[#C7511F] hover:underline">
                      {item.products?.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600">Qty: <span className="font-medium text-gray-900">{item.quantity}</span></span>
                      {item.is_bulk_pricing && (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-sm">Bulk Price Applied</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="flex flex-col items-end mt-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 whitespace-nowrap">{formatCurrency(item.price)} each</span>
                          {item.original_price && item.original_price > item.price && (
                          <span className="text-[10px] text-gray-400 line-through whitespace-nowrap">{formatCurrency(item.original_price)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Container>
  )
}