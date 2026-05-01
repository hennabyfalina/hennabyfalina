// src/app/(shop)/cart/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { useAuth } from '@/hooks/useAuth'
import { useWishlistStore } from '@/store/wishlist.store'
import Container from '@/components/ui/Container'
import QuantitySelector from '@/components/product/QuantitySelector'
import RecentlyViewed from '@/components/product/RecentlyViewed'
import CartRecommendations from '@/components/cart/CartRecommendations'
import Loader from '@/components/ui/Loader'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { Trash2, ShoppingBag, XCircle, Package, Box, ShieldCheck, Truck, CheckCircle2, ExternalLink } from 'lucide-react'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { showToast } from '@/components/ui/Toast'

// B2B & Tax Imports
import { B2B_CONSTANTS, PRINTING_TIERS } from '@/config/b2b-rules'
import { calculateTaxBreakdown } from '@/lib/tax'
import { getSignedB2BUrl } from '@/lib/supabase/b2b-storage' 
import PreviewModal from '@/components/ui/PreviewModal' 
import StarRating from '@/components/product/StarRating'

export default function CartPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  const { savedProductIds, toggleItem } = useWishlistStore()
  
  const [mounted, setMounted] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Preview Modal State
  const [previewModalState, setPreviewModalState] = useState({ isOpen: false, url: '', name: '' })
  const [isFetchingPreview, setIsFetchingPreview] = useState<string | null>(null)
  
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="flex-1 min-h-[60vh] bg-[#ffffff] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice > currentPrice) {
      const discount = ((originalPrice - currentPrice) / originalPrice) * 100
      return Math.round(discount)
    }
    return 0
  }

  const handleViewArtwork = async (internalPath: string) => {
    setIsFetchingPreview(internalPath)
    try {
      const signedUrl = await getSignedB2BUrl(internalPath)
      if (!signedUrl) throw new Error('Link expired or invalid')
      setPreviewModalState({
        isOpen: true,
        url: signedUrl,
        name: internalPath.split('/').pop() || 'Artwork Preview'
      })
    } catch (error) {
      showToast('Failed to load artwork. Please try again.', 'error')
    } finally {
      setIsFetchingPreview(null)
    }
  }

  const maxDispatchDays = items.length > 0 
    ? Math.max(...items.map(item => {
        const tier = PRINTING_TIERS.find(t => t.id === item.printing_type)
        return tier ? tier.days : B2B_CONSTANTS.STANDARD_DELIVERY_DAYS
      }))
    : B2B_CONSTANTS.STANDARD_DELIVERY_DAYS

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
                <Link href="/login" className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-sm font-bold hover:bg-gray-800 transition-colors text-center text-sm whitespace-nowrap">
                  Sign in
                </Link>
              )}
              <Link href="/products" className="flex-1 py-2 px-4 border border-gray-300 bg-white text-gray-800 rounded-sm font-bold hover:bg-gray-50 transition-colors text-center text-sm shadow-sm whitespace-nowrap">
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
  const taxBreakdown = calculateTaxBreakdown(totalPrice)

  const handleClearCart = () => {
    clearCart()
    setShowConfirmClear(false)
    showToast('Cart cleared')
  }

  const handleProceedToBuy = () => {
    setIsCheckingOut(true)
    router.prefetch('/checkout')
    setTimeout(() => router.push('/checkout'), 450)
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
                  <button onClick={() => setShowConfirmClear(true)} className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mt-1 cursor-pointer">
                    Deselect all items
                  </button>
                )}
              </div>
              <span className="text-sm font-medium text-gray-500 hidden sm:block pb-1">Price</span>
            </div>

            <div className="flex flex-col">
              {items.map((item, index) => {
                const isSaved = savedProductIds.includes(item.product_id)
                let imageSrc = '/placeholder-product.svg'
                if (item.image) {
                  imageSrc = item.image.startsWith('http') || item.image.startsWith('/') ? item.image : getPublicUrl(item.image)
                }

                const tier = PRINTING_TIERS.find(t => t.id === item.printing_type)
                const minQuantity = tier ? tier.minQty : B2B_CONSTANTS.RETAIL_MIN_QTY
                
                return (
                  <div key={`${item.id}-${item.printing_type}`} className={`flex gap-4 md:gap-6 py-5 ${index !== items.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-sm border border-gray-100 overflow-hidden flex-shrink-0">
                      <Image src={imageSrc} alt={item.name} fill sizes="(max-width: 768px) 96px, 128px" className="object-cover mix-blend-multiply" />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.slug}`} target="_blank" rel="noopener noreferrer" className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2 hover:text-[#007185] hover:underline cursor-pointer leading-snug">
                            {item.name}
                          </Link>

                          <div className="mt-1 mb-1">
                            <div className="hidden sm:flex">
                              <StarRating rating={item.rating ?? 4.5} reviewCount={item.review_count ?? 128} size="sm" />
                            </div>
                            <div className="flex sm:hidden">
                              <StarRating rating={item.rating ?? 4.5} reviewCount={item.review_count ?? 128} size="sm" hideReviewCount={true} />
                            </div>
                          </div>

                          <div className="flex sm:hidden items-center gap-1.5 mt-1 flex-wrap mb-1">
                            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            {item.original_price && item.original_price > item.price && (
                              <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                                {formatCurrency(item.original_price * item.quantity)}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1.5 mb-2 line-clamp-2 hidden sm:block">{item.description}</p>
                          )}

                          {( (item as any).weight || (item as any).dimensions ) && (
                            <div className="text-[11px] text-gray-500 mb-1.5 gap-3 hidden sm:flex">
                              {(item as any).weight && <span><span className="font-medium text-gray-700">Weight:</span> {(item as any).weight} kg</span>}
                              {(item as any).dimensions && <span><span className="font-medium text-gray-700">Dimensions:</span> {(item as any).dimensions.length}x{(item as any).dimensions.width}x{(item as any).dimensions.height} cm</span>}
                            </div>
                          )}
                          
                          <p className="text-xs text-green-700 mt-1.5 font-medium">In stock</p>
                          
                          {/* 🚨 CLEAN B2B METADATA UI 🚨 */}
                          {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                            <div className="mt-2 text-xs sm:text-[13px] text-gray-700 bg-blue-50/50 p-2 sm:p-3 rounded-md border border-blue-100/50 space-y-1.5 sm:space-y-2">
                              <p>
                                <span className="font-bold text-gray-900">Customization:</span> {tier?.title || item.printing_type}
                              </p>
                              
                              {item.printing_instructions && (
                                <p className="text-gray-700 italic leading-relaxed line-clamp-3 sm:line-clamp-none" title={item.printing_instructions}>
                                  <span className="font-semibold not-italic text-gray-900">Notes:</span> "{item.printing_instructions}"
                                </p>
                              )}

                              {/* 🚨 UPGRADED TO HANDLE ARRAY OF FILES 🚨 */}
                              {item.artwork_urls && item.artwork_urls.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-2 pt-0.5">
                                  {item.artwork_urls.map((url, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleViewArtwork(url)}
                                      disabled={isFetchingPreview === url}
                                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:py-1.5 py-1 sm:px-3 bg-white border border-blue-200 hover:border-[#007185] hover:bg-[#F0F8FF] text-[11px] sm:text-xs font-bold text-[#007185] rounded-md transition-colors shadow-sm cursor-pointer"
                                    >
                                      {isFetchingPreview === url ? (
                                        <><div className="w-3 h-3 border-2 border-[#007185] border-t-transparent rounded-full animate-spin" /> Fetching...</>
                                      ) : (
                                        <><ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> View File {idx + 1}</>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {item.bulk_price && item.bulk_min_quantity && item.quantity >= item.bulk_min_quantity && (
                              <div className="inline-flex items-center gap-1 text-[10px] xs:text-xs bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-sm animate-in zoom-in duration-300 whitespace-nowrap">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                                <span className="font-bold text-green-700">Bulk Price Applied!</span>
                                <span className="text-green-600 font-medium hidden sm:inline">{formatCurrency(item.bulk_price)}/item</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="hidden sm:block text-right shrink-0 ml-2">
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

                      <div className="mt-auto pt-3 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-6">
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(q) => updateQuantity(item.product_id, q, item.printing_type)}
                          min={minQuantity} 
                          max={item.stock > 0 ? item.stock : 99999}
                        />
                        
                        <div className="flex items-center gap-3 sm:gap-4 ml-2 sm:ml-0 border-l sm:border-0 border-gray-200 pl-3 sm:pl-0">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await toggleItem(item.product_id)
                                showToast(isSaved ? 'Removed from Wishlist' : 'Saved to Wishlist')
                              } catch (error: any) {
                                if (error.message === 'unauthorized') router.push('/login?redirect=/cart')
                                else showToast('Failed to update wishlist')
                              }
                            }}
                            className="text-xs sm:text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer"
                          >
                            {isSaved ? 'Remove' : 'Save for later'}
                          </button>

                          <span className="text-gray-300">|</span>

                          <button
                            type="button"
                            onClick={() => {
                              removeItem(item.product_id, item.printing_type)
                              showToast('Item removed')
                            }}
                            className="text-xs sm:text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
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

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm lg:sticky lg:top-24">
              
              <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="bg-white p-2 rounded-full shadow-sm shrink-0 border border-gray-100">
                  <Truck className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated Dispatch</p>
                  <p className="text-sm font-bold text-gray-900">{maxDispatchDays} Days <span className="font-normal text-gray-600 text-xs">(All items combined)</span></p>
                </div>
              </div>

              <div className="flex items-start gap-2 mb-4 text-sm text-green-700">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <span><span className="font-bold text-gray-900">B2B Guarantee:</span> Your order includes 100% compliant 18% GST Invoicing for Input Tax Credit.</span>
              </div>

              <div className="mb-6 border-b border-gray-200 pb-4">
                <div className="flex flex-wrap items-end justify-between gap-2 mb-1">
                  <span className="text-lg text-gray-900">Total Payable:</span> 
                  <span className="font-bold whitespace-nowrap text-2xl text-gray-900">{formatCurrency(finalTotal)}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Subtotal for {items.reduce((acc, item) => acc + item.quantity, 0).toLocaleString()} items</p>
              </div>

              <button
                onClick={handleProceedToBuy}
                disabled={isCheckingOut}
                className="w-full h-11 flex items-center justify-center bg-[#FFD814] text-gray-900 rounded-full font-medium text-[15px] hover:bg-[#F7CA00] active:scale-[0.98] transition-all shadow-sm border border-[#FCD200] disabled:opacity-75 disabled:cursor-wait cursor-pointer"
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Secure Checkout...</span>
                  </div>
                ) : (
                  'Proceed to Buy'
                )}
              </button>

              <div className="mt-4 pt-4 flex flex-col gap-2 text-xs text-gray-600">
                <div className="flex justify-between gap-2">
                  <span>Items Total (Excl. GST):</span>
                  <span className="text-right whitespace-nowrap ml-2">{formatCurrency(taxBreakdown.basePrice)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Estimated GST (18%):</span>
                  <span className="text-right whitespace-nowrap ml-2">{formatCurrency(taxBreakdown.totalGST)}</span>
                </div>
                
                <div className="flex justify-between gap-2 mt-1 border-t border-gray-100 pt-2">
                  <span>Delivery:</span>
                  <span className="text-right whitespace-nowrap ml-2">{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
                </div>
                
                <div className="flex justify-between text-[#B12704] font-bold text-sm mt-2 pt-2 border-t border-gray-200 gap-2">
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
              <p className="text-sm text-gray-600 mb-6">This action cannot be undone. All {items.length} items will be removed from your cart.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmClear(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm transition-colors shadow-sm cursor-pointer">Cancel</button>
                <button onClick={handleClearCart} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors shadow-sm border border-red-700 cursor-pointer">Clear All</button>
              </div>
            </div>
          </div>
        )}
      </Container>

      <PreviewModal 
        isOpen={previewModalState.isOpen} 
        onClose={() => setPreviewModalState({ isOpen: false, url: '', name: '' })} 
        fileUrl={previewModalState.url} 
        fileName={previewModalState.name} 
      />
    </div>
  )
}