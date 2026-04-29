// src/components/product/QuickViewModal.tsx

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, ArrowRight, CheckCircle2, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuickViewStore } from '@/store/quickview.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { showToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import StarRating from '@/components/product/StarRating'
import AddToCartButton from '@/components/product/AddToCartButton'
import BuyNowButton from '@/components/product/BuyNowButton'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import { formatCurrency } from '@/lib/utils'
import { siteConfig } from '@/config/site'

export default function QuickViewModal() {
  const { isOpen, product, productList, closeQuickView, nextProduct, prevProduct } = useQuickViewStore()
  const [mounted, setMounted] = useState(false)
  const { savedProductIds, toggleItem } = useWishlistStore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickView()
      if (e.key === 'ArrowLeft') prevProduct()
      if (e.key === 'ArrowRight') nextProduct()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeQuickView, prevProduct, nextProduct])

  // Swipe to change Product Gesture
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  if (!mounted || !isOpen || !product) return null

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null)
    setTouchStartX(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }
  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    const distance = touchStartX - touchEndX
    if (distance > 50) nextProduct()
    if (distance < -50) prevProduct()
    setTouchStartX(null)
    setTouchEndX(null)
  }

  const isSaved = product ? savedProductIds.includes(product.id) : false

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product) return
    try {
      await toggleItem(product.id)
      showToast(isSaved ? 'Removed from Wishlist' : 'Saved to Wishlist', 'success')
    } catch (error: any) {
      if (error.message === 'unauthorized') {
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        closeQuickView()
        router.push(`/login?redirect=${currentUrl}`)
      } else {
        showToast('Failed to update wishlist', 'error')
      }
    }
  }

  const sellingPrice = product.selling_price ?? product.price ?? 0
  const regularPrice = product.price ?? 0
  const hasDiscount = regularPrice > sellingPrice
  const isOutOfStock = product.stock <= 0

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeQuickView}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={closeQuickView}
          className="absolute top-3 right-3 z-50 p-2 bg-white/80 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Image */}
        <div className="w-full md:w-1/2 bg-[#F8F8F8] p-8 flex items-center justify-center relative min-h-[300px]">
          {productList && productList.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevProduct(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-gray-200 rounded-full shadow-sm text-gray-800 transition-all z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007185]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextProduct(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-gray-200 rounded-full shadow-sm text-gray-800 transition-all z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007185]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="relative w-full max-w-[350px]">
            <ProductImageGallery images={product.images || []} productName={product.name} />
          </div>
        </div>

        {/* Right Side: Details */}
        <div 
          className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto no-scrollbar"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex justify-between items-start gap-4 mb-2 relative">
            <h2 className="text-xl md:text-2xl font-medium text-gray-900 leading-tight">
              {product.name}
            </h2>
            <button 
              onClick={handleWishlist}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 rounded-full border border-[#D5D9D9] shadow-sm transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007185] md:mt-4"
              title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
            </button>
          </div>
          
          <div className="mb-4">
            <StarRating rating={product.rating ?? 4.5} reviewCount={product.review_count ?? 128} size="sm" />
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(sellingPrice)}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">{formatCurrency(regularPrice)}</span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-sm text-red-600 font-medium mt-1">
                You save {Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)}%
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Eligible for FREE Delivery by <span className="font-bold text-gray-900">{siteConfig.shortName}</span>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6 flex-1">
            <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
              {product.description || 'Premium quality packaging material designed for durability and professional presentation.'}
            </p>
          </div>

          <div className="mt-auto space-y-4">
            {isOutOfStock ? (
              <p className="text-red-600 font-bold text-sm">Currently unavailable.</p>
            ) : (
              <p className="text-green-700 font-bold text-sm">In Stock.</p>
            )}

            <div className="w-full flex flex-col gap-2.5">
              <AddToCartButton product={product as any} className="w-full h-11 text-base font-medium bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full shadow-sm cursor-pointer" />
              <BuyNowButton 
                product={product as any} 
                className="w-full h-11 flex items-center justify-center gap-2 text-base font-bold bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all" 
              />
            </div>

            <Link 
              href={`/product/${product.slug}`}
              onClick={closeQuickView}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline"
            >
              See full product details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}