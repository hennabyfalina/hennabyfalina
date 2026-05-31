// src/components/product/QuickViewModal.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Info, ArrowRight } from 'lucide-react'
import { useQuickViewStore } from '@/store/quickview.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import StarRating from '@/components/product/StarRating'
import AddToCartButton from '@/components/product/AddToCartButton'
import BuyNowButton from '@/components/product/BuyNowButton'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

export default function QuickViewModal() {
  const { isOpen, product: initialProduct, closeQuickView } = useQuickViewStore()
  const [fullProduct, setFullProduct] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { savedProductIds, toggleItem } = useWishlistStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 🚨 SILENT BACKGROUND ENGINE: Syncs metadata quietly without layout flickering
  const fetchFullProduct = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, pricing_tiers:product_pricing_tiers(*)')
      .eq('id', id)
      .single()
    
    if (!error && data) {
      setFullProduct({
        ...data,
        pricing_tiers: data.pricing_tiers?.filter((t: any) => !t.is_deleted).sort((a: any, b: any) => a.sort_order - b.sort_order)
      })
    }
  }, [supabase])

  useEffect(() => {
    if (isOpen && initialProduct?.id) {
      fetchFullProduct(initialProduct.id)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setFullProduct(null)
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen, initialProduct, fetchFullProduct])

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!initialProduct) return
    const isSaved = savedProductIds.includes(initialProduct.id)
    showToast(!isSaved ? 'Saved to Wishlist' : 'Removed from Wishlist', 'success')
    try {
      await toggleItem(initialProduct.id)
    } catch (error: any) {
      if (error.message === 'unauthorized') {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
        closeQuickView()
      }
    }
  }

  if (!isOpen || !mounted || !initialProduct) return null

  // 🚨 NAN PROTECTION: Safe math targets that bind to context structures smoothly
  const targetProduct = fullProduct || initialProduct
  const tiers = targetProduct.pricing_tiers || initialProduct.pricing_tiers || []
  
  const defaultTier = tiers.length > 0 
    ? tiers[0] 
    : { 
        mrp: targetProduct.price || initialProduct.price || 0, 
        selling_price: targetProduct.selling_price || initialProduct.selling_price || initialProduct.price || 0, 
        min_quantity: 1,
        requires_artwork: false 
      }

  const sellingPrice = defaultTier.selling_price
  const regularPrice = defaultTier.mrp
  const hasDiscount = regularPrice > sellingPrice
  const discountPercent = hasDiscount ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100) : 0
  const isSaved = savedProductIds.includes(initialProduct.id)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={closeQuickView}>
      <div 
        className="relative w-full max-w-4xl bg-white rounded-md shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-in zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amazon Minimal Close Trigger */}
        <button onClick={closeQuickView} className="absolute top-3 right-3 z-50 p-1.5 bg-white hover:bg-gray-100 rounded-full border border-gray-200 transition-colors cursor-pointer shadow-sm">
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* LEFT COMPACT IMAGE GALLERY - STICKY ON MOBILE TOP */}
        <div className="w-full md:w-1/2 bg-white border-r border-gray-100 p-2 flex items-center justify-center shrink-0 sticky top-0 z-20 md:relative md:overflow-y-auto">
          <div className="w-full max-w-[350px] md:max-w-none mx-auto">
            <ProductImageGallery images={fullProduct?.images || initialProduct.images || []} productName={initialProduct.name} />
          </div>
        </div>

        {/* RIGHT COMPACT SPECIFICATIONS PANEL */}
        <div className="w-full md:w-1/2 flex flex-col bg-white overflow-y-auto p-5 sm:p-6 md:p-7">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F1111] leading-tight mb-2">
              {initialProduct.name}
            </h2>
            
            <div className="flex items-center gap-4 mb-4">
              <StarRating rating={initialProduct.rating ?? 4.5} reviewCount={initialProduct.review_count ?? 128} size="sm" />
              <button 
                onClick={handleWishlist}
                className="flex items-center gap-1.5 text-xs font-medium text-[#007185] hover:text-[#C7511F] transition-colors cursor-pointer group border-l border-gray-200 pl-4"
              >
                <Heart className={`w-4 h-4 transition-all ${isSaved ? 'fill-[#CC0C39] text-[#CC0C39]' : 'group-hover:scale-110'}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* Price Calculations Block */}
            <div className="space-y-0.5 mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#0F1111]">{formatCurrency(sellingPrice)}</span>
                <span className="text-sm text-gray-500">/ unit</span>
                {hasDiscount && (
                  <span className="text-sm sm:text-base text-gray-500 line-through font-normal ml-2">{formatCurrency(regularPrice)}</span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs sm:text-sm text-[#CC0C39] font-semibold">You save: {formatCurrency(regularPrice - sellingPrice)} ({discountPercent}%)</p>
              )}
              <p className="text-[11px] text-gray-400 font-medium pt-0.5">Price inclusive of all taxes (18% GST Applicable)</p>
            </div>

            {/* Pricing Dynamic Tier List */}
            {tiers.length > 1 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#007185]" /> Wholesale Pricing
                </p>
                <div className="space-y-2">
                  {tiers.map((t: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-[#0F1111] font-medium">{t.tier_name}</span>
                        <span className="text-[11px] text-gray-500">Min. {t.min_quantity} units</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#08ab1b]">{formatCurrency(t.selling_price)}</div>
                        {t.mrp > t.selling_price && (
                          <div className="text-[10px] text-gray-400 line-through">{formatCurrency(t.mrp)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Status Flag */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${initialProduct.stock > 0 ? 'bg-green-600' : 'bg-red-600'}`} />
              <span className={`text-xs font-bold ${initialProduct.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {initialProduct.stock > 0 ? 'In Stock.' : 'Currently Unavailable.'}
              </span>
            </div>

            {/* Clean Functional B2B Description Block */}
            {targetProduct.description && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Product Description</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {targetProduct.description}
                </p>
              </div>
            )}
          </div>

          {/* COMPACT B2B CONVERSION ACTIONS ZONE */}
          <div className="space-y-2.5 mt-auto pt-4 border-t border-gray-100">
            {/* 1. Add to Cart: Primary Action (Bold Weight) */}
            <AddToCartButton 
              product={fullProduct || initialProduct} 
              quantity={defaultTier.min_quantity}
              minQuantity={defaultTier.min_quantity}
              requireCustomizationChoice={true}
              className="w-full h-11 text-sm font-bold bg-[#FFD814] hover:bg-[#F7CA00] border-[#FCD200] rounded-full shadow-sm cursor-pointer transition-transform active:scale-[0.99]"
            />
            
            {/* 2. Customize & Buy: Secondary Action (Normal Weight per layout standard request) */}
            <BuyNowButton 
                product={fullProduct || initialProduct} 
                quantity={defaultTier.min_quantity}
                requireCustomizationChoice={true}
                className="w-full h-11 flex items-center justify-center gap-2 text-sm font-normal bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full shadow-sm cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60" 
            />

            <Link 
              href={`/product/${initialProduct.slug}`}
              onClick={closeQuickView}
              className="flex items-center justify-center gap-1.5 w-full pt-2 text-xs font-bold text-[#007185] hover:text-[#C7511F] transition-all cursor-pointer group"
            >
              See full product specifications <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}