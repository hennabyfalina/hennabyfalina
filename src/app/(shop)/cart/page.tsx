// src/app/(shop)/cart/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { useAuth } from '@/hooks/useAuth'
import Container from '@/components/ui/Container'
import QuantitySelector from '@/components/product/QuantitySelector'
import RecentlyViewed from '@/components/product/RecentlyViewed'
import CartRecommendations from '@/components/cart/CartRecommendations'
import Loader from '@/components/ui/Loader'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { Trash2, ShoppingBag, XCircle, Package, Box, ShieldCheck, Truck, Tag, Percent, CheckCircle2 } from 'lucide-react'
import StarRating from '@/components/product/StarRating'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { showToast } from '@/components/ui/Toast'

export default function CartPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  
  const [mounted, setMounted] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="flex-1 min-h-[60vh] bg-[#ffffff] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice > currentPrice) {
      const discount = ((originalPrice - currentPrice) / originalPrice) * 100
      return Math.round(discount)
    }
    return 0
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F2F2] py-8">
        <Container>
          <div className="bg-white p-8 md:p-12 rounded-md border border-gray-200 shadow-sm max-w-4xl mx-auto flex flex-col items-center text-center mb-8">
            <div className="relative h-32 w-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gray-50 rounded-full scale-110" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <Box className="w-16 h-16 text-gray-400 absolute -rotate-12 translate-x-[-20%] translate-y-[-10%]" />
                <Package className="w-12 h-12 text-gray-300 absolute rotate-12 translate-x-[25%] translate-y-[15%] border-2 border-white rounded-md bg-white" />
                <div className="absolute bottom-2 right-2 bg-white p-1.5 rounded-sm shadow-sm border border-gray-100">
                  <ShoppingBag className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is empty</h2>
            <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
              Check your saved for later items below or continue shopping.
            </p>
            
            <div className="flex flex-row gap-3 w-full max-w-md justify-center">
              {!user && !isLoading && (
                <Link
                  href="/login"
                  className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-sm font-bold hover:bg-gray-800 transition-colors text-center text-sm whitespace-nowrap"
                >
                  Sign in to your account
                </Link>
              )}
              <Link
                href="/products"
                className="flex-1 py-2 px-4 border border-gray-300 bg-white text-gray-800 rounded-sm font-bold hover:bg-gray-50 transition-colors text-center text-sm shadow-sm whitespace-nowrap"
              >
                Shop Now
              </Link>
            </div>
          </div>

          <div className="w-full bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm">
            <RecentlyViewed />
          </div>
        </Container>
      </div>
    )
  }

  const shippingCost = totalPrice > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const finalTotal = totalPrice + shippingCost

  const handleClearCart = () => {
    clearCart()
    setShowConfirmClear(false)
    showToast('Cart cleared successfully')
  }

  const handleProceedToBuy = () => {
    setIsCheckingOut(true)
    router.prefetch('/checkout')
    
    setTimeout(() => {
      router.push('/checkout')
    }, 450)
  }

  return (
    <div className="min-h-screen bg-[#F0F2F2] py-6 md:py-8">
      <Container className="pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-8 bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-end justify-between border-b border-gray-200 pb-2 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shopping Cart</h1>
                {items.length > 1 && (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="text-sm text-blue-700 hover:text-red-700 hover:underline mt-1"
                  >
                    Deselect all items
                  </button>
                )}
              </div>
              <span className="text-sm font-medium text-gray-500 hidden sm:block pb-1">Price</span>
            </div>

            <div className="flex flex-col">
              {items.map((item, index) => {
                const discountPercentage = calculateDiscount(item.original_price || item.price, item.price)
                let imageSrc = '/placeholder-product.svg'
                if (item.image) {
                  imageSrc = item.image.startsWith('http') || item.image.startsWith('/') 
                    ? item.image 
                    : getPublicUrl(item.image)
                }
                
                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 md:gap-6 py-4 ${index !== items.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-sm border border-gray-100 overflow-hidden flex-shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 96px, 128px"
                        className="object-cover mix-blend-multiply"
                      />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm md:text-base font-medium text-gray-900 line-clamp-2 hover:text-blue-700 hover:underline">
                            {item.name}
                          </Link>
                          
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {truncateDescription(item.description, 80)}
                            </p>
                          )}
                          
                          <div className="mt-2">
                            <StarRating rating={(item as any).rating ?? 4.5} reviewCount={(item as any).review_count ?? 128} size="sm" />
                          </div>
                          
                          <p className="text-xs text-green-700 mt-1 font-medium">In stock</p>
                          <p className="text-xs text-gray-500 mt-1">Eligible for FREE Shipping</p>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {item.bulk_price && item.bulk_min_quantity && item.quantity >= item.bulk_min_quantity ? (
                              <div className="inline-flex items-center gap-1 text-[10px] xs:text-xs bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-sm animate-in zoom-in duration-300 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                              <span className="font-bold text-green-700">Bulk Price Applied!</span>
                              <span className="text-green-600 font-medium hidden xs:inline">{formatCurrency(item.bulk_price)}/item</span>
                            </div>
                          ) : item.bulk_price && item.bulk_min_quantity && item.quantity < item.bulk_min_quantity ? (
                            <div className="inline-flex items-center gap-1 text-[10px] xs:text-xs bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                              <Tag className="w-3 h-3 text-amber-600" />
                              <span className="font-medium text-amber-700">Add {item.bulk_min_quantity - item.quantity} more for <span className="font-bold text-amber-800">{formatCurrency(item.bulk_price)}</span></span>
                            </div>
                          ) : null}
                          
                          {discountPercentage > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] xs:text-xs bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                              <Percent className="w-3 h-3 text-red-500" />
                              <span className="font-medium text-red-600">Save {discountPercentage}%</span>
                            </div>
                          )}
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{formatCurrency(item.price)} each</p>
                          )}
                          {item.original_price && item.original_price > item.price && (
                            <p className="text-xs text-gray-400 line-through mt-0.5">
                              <span className="whitespace-nowrap">{formatCurrency(item.original_price)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex flex-wrap items-center gap-5 sm:gap-6">
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(q) => updateQuantity(item.product_id, q)}
                          max={item.stock > 0 ? item.stock : 999}
                        />
                        
                        {/* The standard red link for Delete */}
                        <button
                          type="button"
                          onClick={async () => {
                            await removeItem(item.product_id)
                            showToast('Item removed')
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-right border-t border-gray-200 pt-4 mt-2">
              <p className="text-lg text-gray-900 flex flex-wrap items-end justify-end gap-2">
                <span>Subtotal ({items.length} items):</span> <span className="font-bold whitespace-nowrap">{formatCurrency(totalPrice)}</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm lg:sticky lg:top-24">
              
              {shippingCost === 0 ? (
                <div className="flex items-start gap-2 mb-4 text-sm text-green-700">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <span>Your order is eligible for FREE Delivery. <br/>Select this option at checkout.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 mb-4 text-sm text-gray-700">
                  <Truck className="w-5 h-5 flex-shrink-0 text-gray-500" />
                  <span>Add <span className="text-red-600 font-bold">{formatCurrency(SHIPPING_THRESHOLD - totalPrice)}</span> of eligible items to your order to qualify for FREE Delivery.</span>
                </div>
              )}

              <div className="text-lg text-gray-900 mb-6 flex flex-wrap items-end justify-between gap-2">
                <span>Subtotal ({items.length} items):</span> <span className="font-bold whitespace-nowrap">{formatCurrency(totalPrice)}</span>
              </div>

              <button
                onClick={handleProceedToBuy}
                disabled={isCheckingOut}
                className="w-full h-11 flex items-center justify-center bg-[#FFD814] text-gray-900 rounded-sm font-medium text-sm hover:bg-[#F7CA00] active:scale-[0.98] transition-all shadow-sm border border-[#FCD200] disabled:opacity-75 disabled:cursor-wait"
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Proceed to Buy'
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 text-xs text-gray-500">
                <div className="flex justify-between gap-2">
                  <span>Items:</span>
                  <span className="text-right whitespace-nowrap ml-2">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Delivery:</span>
                  <span className="text-right whitespace-nowrap ml-2">{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-sm mt-2 pt-2 border-t border-gray-200 gap-2">
                  <span>Order Total:</span>
                  <span className="text-right whitespace-nowrap ml-2">{formatCurrency(finalTotal)}</span>
                </div>
                {finalTotal > 0 && (
                  <div className="text-right text-[11px] text-gray-500 mt-1 italic">
                    {numberToIndianWords(finalTotal)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 w-full bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm">
            <RecentlyViewed />
          </div>
        ) : (
          <CartRecommendations />
        )}

        {showConfirmClear && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-md shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200 border border-gray-200">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Cart?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All {items.length} items will be removed from your cart.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors shadow-sm border border-red-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}