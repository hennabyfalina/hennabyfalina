// src/components/product/ProductCard.tsx

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { useWishlistStore } from '@/store/wishlist.store'
import { showToast } from '@/components/ui/Toast'
import { getComputedProductPrices } from '@/lib/pricing'
import type { Product } from '@/types/database.types'

function HighlightMatch({ text, query }: { text: string, query: string }) {
  if (!query) return <span>{text}</span>;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeQuery})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-100 text-gray-900 font-semibold px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

interface ProductCardProps {
  product: Product
  priority?: boolean
  searchQuery?: string
}

export default function ProductCard({ product, priority = false, searchQuery = '' }: ProductCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const { savedProductIds, toggleItem } = useWishlistStore()

  const isSaved = savedProductIds.includes(product.id)
  
  // ⚡ STRATEGIC RE-CALIBRATION: Dynamically processes display baseline rates based on mode switches
  const { hasVariants, displayPrice, discountPct, isOutOfStock } = useMemo(() => {
    return getComputedProductPrices(product, null)
  }, [product])

  const rawImage = product.images?.[0]
  const imageUrl = imgError || !rawImage 
    ? '/placeholder-product.svg' 
    : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const willBeSaved = !isSaved
    
    showToast(willBeSaved ? 'Added to Wishlist' : 'Removed from Wishlist', 'success')
    
    try {
      const result = await toggleItem(product.id)
      if (result === false && willBeSaved) {
        sessionStorage.setItem('pendingWishlist', product.id)
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        router.push(`/login?next=${currentUrl}`)
      }
    } catch (error: any) {
      console.error('Failed to update wishlist state', error)
      showToast('Failed to update wishlist', 'error')
    }
  }

  return (
    <Link 
      href={`/product/${product.slug}`} 
      className="group flex flex-col bg-white overflow-hidden w-full cursor-pointer relative transition-all duration-300 select-none border-b border-stone-100 sm:border sm:border-stone-100 sm:rounded-xl pb-3.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-50/10">
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white/90 text-gray-900 border border-stone-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-none">
              Sold out
            </span>
          </div>
        )}
        
        <button 
          type="button"
          onClick={handleWishlist}
          className="absolute top-2.5 right-3 z-30 flex items-center justify-center p-1 text-stone-400 hover:text-red-500 transition-all cursor-pointer active:scale-110 outline-none"
          aria-label="Wishlist trigger"
        >
          <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-stone-300 group-hover:text-stone-400'}`} strokeWidth={2} />
        </button>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50/20 z-10">
            <div className="w-3.5 h-3.5 border border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          </div>
        )}

        <Image 
          src={imageUrl} 
          alt={product.name} 
          fill 
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={`object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-102 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgError(true)
            setIsLoading(false)
          }}
          unoptimized={imageUrl.startsWith('http')}
        />
      </div>

      {/* Streamlined Typography Metadata Layer */}
      <div className="px-2.5 pt-2.5 flex flex-col flex-grow gap-0.5 text-left">
        <h3 className="text-[14px] font-semibold text-gray-800 group-hover:text-black transition-colors truncate capitalize tracking-tight leading-tight">
          <HighlightMatch text={product.name.toLowerCase()} query={searchQuery} />
        </h3>
        
        <div className="flex items-center gap-1 mt-0.5 text-[14px] sm:text-[15px] font-bold whitespace-nowrap overflow-hidden tracking-tight">
          {hasVariants && (
            <span className="text-[12px] font-semibold text-gray-400 shrink-0 uppercase tracking-wider mr-0.5">From</span>
          )}
          <span className="text-gray-950 shrink-0 font-extrabold">
            {formatCurrency(displayPrice)}
          </span>
          
          {product.mrp && product.mrp > displayPrice && (
            <>
              <span className="text-[12px] sm:text-[13px] text-gray-400 line-through font-medium shrink-0 ml-0.5">
                {formatCurrency(product.mrp)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 shrink-0 ml-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100/40 uppercase tracking-wide">
                {discountPct}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}