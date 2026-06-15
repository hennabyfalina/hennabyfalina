// src/app/(shop)/cart/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { useAuth } from '@/hooks/useAuth'
import { useWishlistStore } from '@/store/wishlist.store'
import Container from '@/components/ui/Container'
import CartQuantitySelector from '@/components/cart/CartQuantitySelector'
import RecentlyViewed from '@/components/product/RecentlyViewed'
import CartRecommendations from '@/components/cart/CartRecommendations'
import CartSkeleton from '@/components/ui/CartSkeleton'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { getProductImageUrl } from '@/lib/supabase/storage'
import { Trash2, ShoppingBag, Box, ShieldCheck, Truck, AlertTriangle, Heart, Zap, Tag } from 'lucide-react'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { showToast } from '@/components/ui/Toast'
import StarRating from '@/components/product/StarRating'
import { broadcast } from '@/lib/broadcast'
import SessionExpiredModal from '@/components/checkout/SessionExpiredModal'
import CartAlertsModal from '@/components/cart/CartAlertsModal'
import { getProductById } from '@/services/product.service'

// Helper to parse variants
function parseVariants(variants: any): Array<{ name: string; price: number; variant_mrp?: number; wholesale_price?: number; wholesale_min_qty?: number }> {
  if (!variants) return []
  if (typeof variants === 'string') {
    try { return JSON.parse(variants) } catch { return [] }
  }
  if (Array.isArray(variants)) return variants
  return []
}

export default function CartPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const addItem = useCartStore((state) => state.addItem)
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  const alerts = useCartStore((state) => state.alerts)
  const clearAlerts = useCartStore((state) => state.clearAlerts)
  const { savedProductIds, toggleItem } = useWishlistStore()
  
  const [mounted, setMounted] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null)
  
  const [productDetails, setProductDetails] = useState<Record<string, any>>({})
  const [loadingVariants, setLoadingVariants] = useState<Record<string, boolean>>({})
  const [isCartLoading, setIsCartLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    setCurrentTimestamp(Date.now())
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setPaymentFailed(params.get('payment_failed') === 'true')
      if (params.get('session_expired') === 'true') {
        setSessionExpired(true)
        const url = new URL(window.location.href)
        url.searchParams.delete('session_expired')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  // Fetch product details for all cart items
  useEffect(() => {
    if (!mounted) return
    const fetchProductDetails = async () => {
      if (items.length === 0) {
        setIsCartLoading(false)
        return
      }
      setIsCartLoading(true)
      const newDetails: Record<string, any> = {}
      const newLoading = { ...loadingVariants }
      for (const item of items) {
        if (!productDetails[item.product_id]) {
          newLoading[item.product_id] = true
          setLoadingVariants(newLoading)
          try {
            const product = await getProductById(item.product_id)
            if (product) newDetails[item.product_id] = product
          } catch (e) {
            console.error('Failed to fetch product', item.product_id, e)
          }
          delete newLoading[item.product_id]
          setLoadingVariants(newLoading)
        }
      }
      if (Object.keys(newDetails).length) {
        setProductDetails(prev => ({ ...prev, ...newDetails }))
      }
      setIsCartLoading(false)
    }
    fetchProductDetails()
  }, [items, mounted])

  const handleVariantChange = async (itemId: string, productId: string, newVariant: { 
    name: string; 
    price: number; 
    variant_mrp?: number;
    wholesale_price?: number;
    wholesale_min_qty?: number;
  }, currentQuantity: number) => {
    const oldItem = items.find(i => i.id === itemId)
    if (!oldItem) return

    const product = productDetails[productId]
    if (!product) return

    const newName = `${product.name} (${newVariant.name})`
    const updateItem = useCartStore.getState().updateItem
    
    await updateItem(itemId, {
      name: newName,
      retail_price: newVariant.price,
      mrp: newVariant.variant_mrp ?? product.mrp,
      variant_string: newVariant.name,
      wholesale_price: newVariant.wholesale_price ?? product.wholesale_price ?? 0,
      wholesale_min_qty: newVariant.wholesale_min_qty ?? product.wholesale_min_qty ?? 999999,
      product_id: productId,
    })
    
    showToast(`Variant changed to ${newVariant.name}`, 'success')
  }

  if (!mounted) return <CartSkeleton />
  if (isCartLoading && items.length > 0) return <CartSkeleton />

  const maxDispatchDays = 2

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-12 select-none animate-fade-in font-sans antialiased">
        <Container>
          <div className="max-w-xl mx-auto flex flex-col items-center text-center py-10 gap-5 mb-6">
            <div className="relative h-24 w-24 flex items-center justify-center rounded-full bg-stone-50 border border-gray-100">
              <ShoppingBag className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
              <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
                {paymentFailed ? <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={2} /> : <Box className="w-4 h-4 text-gray-900" strokeWidth={2} />}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-gray-900">
                {paymentFailed ? 'Payment Not Completed' : 'Your shopping bag is empty'}
              </h2>
              <p className="text-[15px] text-gray-500 font-normal max-w-md mx-auto leading-relaxed">
                {paymentFailed 
                  ? 'Your transaction could not be finished. Feel free to review pending orders inside your account profile dashboard, or check your favorite items.' 
                  : 'Browse our signature chemical-free henna collections to find your perfect pairing setup.'}
              </p>
            </div>
            <div className="flex flex-row gap-3 w-full max-w-sm justify-center pt-4">
              {!user && !authLoading && (
                <Link href="/login?next=/cart" className="flex-1 h-12 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-gray-800 rounded-full font-bold text-[14px] transition-colors">
                  Sign In
                </Link>
              )}
              {paymentFailed && user && (
                <Link href="/profile/orders" className="flex-1 h-12 flex items-center justify-center bg-white text-gray-700 border border-gray-200 rounded-full font-bold hover:bg-stone-50 transition-colors text-[14px] whitespace-nowrap">
                  View Orders
                </Link>
              )}
              <Link href="/products" className="flex-1 h-12 flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-full font-bold transition-colors text-[14px] whitespace-nowrap shadow-sm">
                Shop Collection
              </Link>
            </div>
          </div>
          <div className="w-full border-t border-gray-100">
            <RecentlyViewed />
          </div>
        </Container>
        <SessionExpiredModal isOpen={sessionExpired} onClose={() => setSessionExpired(false)} />
      </div>
    )
  }

  const shippingCost = totalPrice > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const finalTotal = totalPrice + shippingCost
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  
  const totalMrp = items.reduce((sum, item) => sum + (Math.max(item.mrp || 0, item.retail_price) * item.quantity), 0)
  const totalSavings = totalMrp - totalPrice

  const handleClearCart = async () => {
    for (const item of items) broadcast.send({ type: 'CART_ITEM_DELETED', productId: item.product_id })
    clearCart()
    setShowConfirmClear(false)
    showToast('Shopping Bag cleared')
  }

  const handleProceedToBuy = () => {
    setIsCheckingOut(true)
    router.prefetch('/checkout')
    router.push('/checkout')
  }

  return (
    <>
      <div className="min-h-screen bg-white py-6 md:py-10 select-none animate-fade-in font-sans antialiased">
        <Container className="pb-12 px-4 sm:px-8 max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start pt-2">
            
            {/* LEFT COLUMN: CART ITEMS */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 pb-5 mb-2 h-[44px]">
                <div className="flex items-baseline gap-3">
                  <h1 className="text-3xl sm:text-3xl font-normal tracking-tight text-gray-900">Your Cart</h1>
                  <span className="text-[15px] text-gray-500 font-medium">({totalItems} Items)</span>
                </div>
              </div>

              {items.length > 1 && (
                <div className="flex justify-start py-2">
                  <button onClick={() => setShowConfirmClear(true)} className="text-[14px] font-medium text-gray-500 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                    Clear bag
                  </button>
                </div>
              )}

              <div className="flex flex-col divide-y divide-gray-100">
                {items.map((item, index) => {
                  const isSaved = savedProductIds.includes(item.product_id)
                  const imageSrc = item.image ? getProductImageUrl(item.image) : '/placeholder-product.svg'
                  const isBulkOnly = item.retail_price === item.wholesale_price && (item.wholesale_min_qty ?? 1) > 1
                  const minQuantity = isBulkOnly ? item.wholesale_min_qty : 1
                  
                  const product = productDetails[item.product_id]
                  const variants = product ? parseVariants(product.variants) : []
                  const displayMrp = item.mrp
                  const isLoadingVariants = loadingVariants[item.product_id]

                  // Check if wholesale is active for this item
                  const isWholesaleActive = item.wholesale_price && item.wholesale_price > 0 && 
                                            item.wholesale_min_qty && item.quantity >= item.wholesale_min_qty

                  const discountPct = displayMrp && displayMrp > item.price
                    ? Math.round(((displayMrp - item.price) / displayMrp) * 100)
                    : 0

                  return (
                    <div key={item.id} className="flex flex-col gap-4 py-6">
                      <div className="flex gap-4 md:gap-6 items-start w-full">
                        <div className="flex flex-col items-center gap-4 flex-shrink-0">
                          <div className="relative w-24 h-24 md:w-32 md:h-32 bg-stone-50 border border-gray-100 rounded-xl overflow-hidden">
                            <Image 
                              src={imageSrc} 
                              alt={item.name} 
                              fill 
                              sizes="128px" 
                              className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                              priority={index < 3}
                              unoptimized={imageSrc.startsWith('http') || imageSrc.includes('supabase')}
                            />
                          </div>
                          <CartQuantitySelector
                            quantity={item.quantity}
                            onQuantityChange={(q) => {
                              updateQuantity(item.id, q)
                              broadcast.send({ type: 'CART_ITEM_UPDATED', productId: item.product_id })
                            }}
                            min={minQuantity} 
                            max={item.stock > 0 ? item.stock : 99999}
                          />
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                          <Link 
                            href={`/product/${item.slug}`} 
                            className="text-[18px] sm:text-[22px] font-medium text-gray-900 line-clamp-2 hover:text-blue-600 hover:underline decoration-2 underline-offset-4 transition-colors cursor-pointer leading-tight"
                          >
                            {item.name}
                          </Link>

                          {item.description && (
                            <p className="text-[14px] sm:text-[15px] text-gray-500 font-normal line-clamp-1 mt-1.5">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-1 pt-3">
                            <StarRating rating={item.rating ?? 4.5} reviewCount={item.review_count ?? 128} size="md" hideReviewCount={false} />
                          </div>

                          {/* Pricing row – uses store's active price */}
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            {discountPct > 0 && (
                              <span className="text-[20px] sm:text-[22px] font-bold text-emerald-600 tracking-tight">
                                ↓{discountPct}%
                              </span>
                            )}
                            {displayMrp && displayMrp > item.price && (
                              <span className="text-[20px] sm:text-[22px] text-gray-400 line-through font-normal">
                                {formatCurrency(displayMrp * item.quantity)}
                              </span>
                            )}
                            <span className="text-[20px] sm:text-[22px] font-bold text-gray-950">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            {isWholesaleActive && (
                              <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Tag className="w-3 h-3" strokeWidth={1.5} />
                                bulk rate
                              </span>
                            )}
                          </div>

                          {/* Unit price info when wholesale active */}
                          {isWholesaleActive && (
                            <div className="text-[12px] text-emerald-600 mt-0.5">
                              {formatCurrency(item.price)}/unit (wholesale)
                            </div>
                          )}

                          {/* Variant dropdown */}
                          {variants.length > 0 && (
                            <div className="mt-2">
                              {isLoadingVariants ? (
                                <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-md" />
                              ) : (
                                <select
                                  value={item.variant_string || variants[0]?.name || ''}
                                  aria-label={`Select variant for ${item.name}`}
                                  onChange={(e) => {
                                    const selected = variants.find(v => v.name === e.target.value)
                                    if (selected) {
                                      handleVariantChange(item.id, item.product_id, selected, item.quantity)
                                    }
                                  }}
                                  className="h-9 px-3 border border-gray-200 rounded-lg text-[13px] font-medium bg-white focus:outline-none focus:border-gray-950 transition-all cursor-pointer"
                                >
                                  {variants.map(v => (
                                    <option key={v.name} value={v.name}>
                                      {v.name} – {formatCurrency(v.price)}
                                      {v.wholesale_price && v.wholesale_min_qty && ` (${v.wholesale_min_qty}+ → ${formatCurrency(v.wholesale_price)})`}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 mt-1 w-full">
                        <div className="flex flex-1 items-center justify-between sm:justify-start gap-3 sm:gap-10 w-full text-[15px] sm:text-[16px] font-medium text-gray-600">
                          <button
                            onClick={async () => {
                              const willBeSaved = !isSaved
                              try {
                                const result = await toggleItem(item.product_id)
                                if (result === false && willBeSaved) {
                                  sessionStorage.setItem('pendingWishlist', item.product_id)
                                  const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
                                  router.push(`/login?next=${currentUrl}`)
                                } else {
                                  showToast(willBeSaved ? 'Saved to wishlist' : 'Removed from wishlist', 'success')
                                }
                              } catch (error: any) {
                                showToast('Failed to update wishlist', 'error')
                              }
                            }}
                            className="flex items-center gap-2 hover:text-pink-500 transition-colors cursor-pointer group py-2 whitespace-nowrap"
                          >
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} strokeWidth={1.8} />
                            <span>{isSaved ? 'Saved' : 'Save for later'}</span>
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => {
                              broadcast.send({ type: 'CART_ITEM_DELETED', productId: item.product_id })
                              removeItem(item.id)
                              showToast('Item removed from bag', 'success')
                            }}
                            className="flex items-center gap-2 hover:text-red-500 transition-colors py-2 cursor-pointer"
                          >
                            <Trash2 className="w-5 h-5" strokeWidth={1.8} />
                            <span>Remove</span>
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={handleProceedToBuy}
                            className="flex items-center gap-2 text-gray-900 hover:text-emerald-600 transition-colors whitespace-nowrap py-2 cursor-pointer"
                          >
                            <Zap className="w-5 h-5" strokeWidth={1.8} />
                            <span>Buy this now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <div className="lg:col-span-4 w-full">
              <div id="order-summary-section" className="w-full lg:sticky lg:top-24 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-5 mb-2 h-[44px]">
                  <h3 className="text-3xl sm:text-3xl font-normal tracking-tight text-gray-900">Order Summary</h3>
                </div>
                <div className="flex flex-col gap-4 text-[15px] text-gray-600 font-normal pb-5 border-b border-gray-200">
                  <div className="flex justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-normal whitespace-nowrap">{formatCurrency(totalPrice)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between gap-4">
                      <span>Discount</span>
                      <span className="text-emerald-600 font-normal whitespace-nowrap">− {formatCurrency(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <span>Delivery Charges</span>
                    <span className="text-emerald-600 font-normal whitespace-nowrap">{shippingCost === 0 ? 'Free Shipping' : formatCurrency(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between items-start font-normal text-gray-900 text-[18px] pt-4 border-t border-gray-100 mt-2 w-full">
                    <span className="whitespace-nowrap">Total Amount</span>
                    <div className="flex flex-col items-end text-right flex-1 ml-4">
                      <span className="whitespace-nowrap tracking-tight">{formatCurrency(finalTotal)}</span>
                      <span className="text-[13px] sm:text-[14px] text-gray-400 font-normal mt-1 italic capitalize tracking-tight leading-tight w-full text-right">{numberToIndianWords(finalTotal)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleProceedToBuy}
                  disabled={isCheckingOut}
                  className="w-full h-14 flex items-center justify-center bg-gray-900 text-white rounded-full font-bold text-[15px] tracking-wide hover:bg-black active:scale-[0.99] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isCheckingOut ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Proceed to Checkout'}
                </button>
                <div className="flex items-start gap-2 text-[13px] text-gray-500 leading-relaxed font-normal">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" strokeWidth={1.5} />
                  <span>Insulated fresh shipping • Secure Payments • 100% Authentic</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-100 pt-6">
            {items.length === 0 ? <RecentlyViewed /> : <CartRecommendations />}
          </div>

          {showConfirmClear && mounted && createPortal(
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="absolute inset-0 cursor-pointer" onClick={() => setShowConfirmClear(false)} />
              <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100 animate-zoom-in text-left flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-normal text-gray-900">Empty Shopping Bag?</h3>
                  <p className="text-[14px] text-gray-500 font-medium mt-2">This will clear all {items.length} items from your bag.</p>
                </div>
                <div className="flex gap-3 pt-4 w-full">
                  <button onClick={() => setShowConfirmClear(false)} className="flex-1 h-11 text-[14px] font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-full transition-colors cursor-pointer">Cancel</button>
                  <button onClick={handleClearCart} className="flex-1 h-11 text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-sm cursor-pointer">Clear bag</button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </Container>
        <SessionExpiredModal isOpen={sessionExpired} onClose={() => setSessionExpired(false)} />
        <CartAlertsModal alerts={alerts} onDismiss={clearAlerts} />
      </div>
    </>
  )
}