// src/components/product/ProductCard.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, Eye, Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { useQuickViewStore } from '@/store/quickview.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { showToast } from '@/components/ui/Toast'
import { siteConfig } from '@/config/site'
import StarRating from './StarRating'

export interface Product {
  min_order_qty: number
  category_id?: string | null
  id: string
  name: string
  slug: string
  price: number
  selling_price?: number | null
  description?: string | null
  images: string[]
  stock: number
  rating?: number | null
  review_count?: number | null
  pricing_tiers?: any[]
}

interface ProductCardProps {
  product: Product
  priority?: boolean
  productList?: Product[]
  hideMinOrderBadge?: boolean 
  searchQuery?: string
}

export default function ProductCard({ product, priority = false, productList = [], hideMinOrderBadge = false, searchQuery = '' }: ProductCardProps) {
  const router = useRouter()
  const openQuickView = useQuickViewStore((state) => state.openQuickView)
  const { savedProductIds, toggleItem } = useWishlistStore()

  // 🔒 SECURE DYNAMIC CALCULATION: Apply the same minimum target finder
  const tiers = product.pricing_tiers || []
  const dynamicMinQuantity = product.min_order_qty ?? 100;

  const isSaved = savedProductIds.includes(product.id)

  const activeTiers = product.pricing_tiers && product.pricing_tiers.length > 0 
    ? product.pricing_tiers 
    : [{ mrp: product.price || 0, selling_price: product.selling_price || product.price || 0, min_quantity: 1 }]

  const defaultTier = activeTiers[0]
  const regularPrice = defaultTier.mrp || product.price || 0
  const sellingPrice = defaultTier.selling_price || product.selling_price || product.price || 0
  const retailMin = defaultTier.min_quantity

  const safeStock = product.stock ?? retailMin
  const isOutOfStock = safeStock < retailMin
  const hasDiscount = regularPrice > sellingPrice
  const discountPercent = hasDiscount ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100) : 0

  const rawImage = product.images?.[0]
  const imageUrl = !rawImage 
    ? '/placeholder-product.svg' 
    : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const willBeSaved = !isSaved
    showToast(willBeSaved ? 'Saved to Wishlist' : 'Removed from Wishlist', 'success')
    try {
      await toggleItem(product.id)
    } catch (error: any) {
      if (error.message === 'unauthorized') {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      }
    }
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickView(product, productList)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/product/${product.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }) } catch (err) {}
    } else {
      navigator.clipboard.writeText(url)
      showToast('Product link copied!', 'success')
    }
  }

  return (
    <div className="group h-full flex flex-col bg-white border border-gray-200 hover:border-gray-300 rounded-md overflow-hidden hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] transition-all duration-300 w-full cursor-pointer">
      
      {/* PURE WHITE IMAGE BOX */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-white p-4">
        {!hideMinOrderBadge && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <span className="bg-[#CC0C39] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">
              MIN {dynamicMinQuantity}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute top-2 left-2 z-10 bg-gray-900/80 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-sm">
            SOLD OUT
          </div>
        )}
        
        <button 
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 border border-gray-100 rounded-full shadow-md text-gray-400 hover:text-[#CC0C39] transition-all cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Add to wishlist"
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-[#CC0C39] text-[#CC0C39]' : ''}`} />
        </button>

        <Image 
          src={imageUrl} 
          alt={product.name} 
          fill 
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
        />
      </Link>

      <div className="p-4 sm:p-5 flex flex-col flex-grow bg-white">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[16px] font-medium text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2 leading-snug mb-1.5 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-normal text-[#0F1111]">{product.rating ?? 4.5}</span>
          <StarRating rating={product.rating ?? 4.5} reviewCount={product.review_count ?? 128} size="sm" hideReviewCount />
          <span className="text-sm text-[#007185] hover:text-[#C7511F] cursor-pointer">
            ({product.review_count ?? 128})
          </span>
        </div>
        
        <div className="mt-auto">
          <div className="text-2xl font-bold text-[#0F1111] leading-none mb-1.5">
            {formatCurrency(sellingPrice)}
          </div>
          {hasDiscount && (
            <div className="text-[13px] text-[#565959] mb-1.5">
              M.R.P: <span className="line-through">{formatCurrency(regularPrice)}</span> <span className="text-[#CC0C39]">({discountPercent}% off)</span>
            </div>
          )}
          <div className="text-[12px] text-[#0F1111] flex items-center gap-1">
            FREE Delivery by <span className="font-bold">{siteConfig.shortName}</span>
          </div>
        </div>

        {/* PRO ACTION ROW */}
        <div className="mt-4 flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.preventDefault()
              router.push(`/product/${product.slug}`)
            }}
            disabled={isOutOfStock}
            className="flex-1 h-9 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-[11px] sm:text-[13px] font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-60 whitespace-nowrap px-1 sm:px-2"
          >
            View Options
          </button>
          
          <button 
            onClick={handleQuickView}
            className="w-9 h-9 flex items-center justify-center bg-white border border-[#D5D9D9] hover:bg-gray-50 text-gray-700 rounded-full transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            title="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button 
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center bg-white border border-[#D5D9D9] hover:bg-gray-50 text-gray-700 rounded-full transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            title="Share Product"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}