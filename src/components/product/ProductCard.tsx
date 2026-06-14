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

function HighlightMatch({ text, query }: { text: string, query: string }) {
  if (!query) return <span>{text}</span>;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeQuery})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-gray-900 font-bold px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

interface ProductVariant {
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  slug: string
  sku?: string | null
  description?: string | null
  images: string[]
  stock: number
  rating?: number | null
  review_count?: number | null
  category_id?: string | null
  is_active: boolean
  is_deleted: boolean
  retail_price: number
  wholesale_price: number
  wholesale_min_qty: number
  mrp?: number | null
  variants?: ProductVariant[] | string | any 
  is_featured?: boolean
  frequently_bought_together?: string[] | null
  weight?: number | null
  weight_unit?: string | null
  gsm?: number | null
  dimensions?: any | null
  meta_title?: string | null
  meta_description?: string | null
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
  
  const { hasVariants, displayPrice, discountPct, isOutOfStock } = useMemo(() => {
    return getComputedProductPrices(product as any, null)
  }, [product])

  const rawImage = product.images?.[0]
  const imageUrl = imgError || !rawImage 
    ? '/placeholder-product.svg' 
    : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const willBeSaved = !isSaved
    
    // Optimistic toast
    showToast(willBeSaved ? 'Added to Wishlist' : 'Removed from Wishlist', 'success')
    
    try {
      const result = await toggleItem(product.id)
      
      // If result is false and we were trying to add (not remove) – unauthorized
      if (result === false && willBeSaved) {
        // Store the product ID to add after login
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
      className="group flex flex-col bg-white overflow-hidden w-full cursor-pointer relative transition-all duration-300 select-none border-b border-gray-100 sm:border border-gray-100 sm:rounded-2xl pb-4"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-50/20">
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white/90 text-gray-900 border border-gray-200 text-[11px] font-medium px-3 py-1.5 rounded-full shadow-xs tracking-normal">
              Sold out
            </span>
          </div>
        )}
        
        <button 
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-30 flex items-center justify-center p-1 text-gray-400 hover:text-red-500 transition-all cursor-pointer active:scale-125"
          aria-label="Wishlist trigger"
        >
          <Heart className={`w-6 h-6 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} strokeWidth={1.5} />
        </button>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50/30 z-10">
            <div className="w-4 h-4 border border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )}

        <Image 
          src={imageUrl} 
          alt={product.name} 
          fill 
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={`object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgError(true)
            setIsLoading(false)
          }}
          unoptimized={imageUrl.startsWith('http') || imageUrl.includes('supabase')}
        />
      </div>

      <div className="px-3 pt-3 flex flex-col flex-grow gap-1">
        <h3 className="text-[16px] font-normal text-gray-700 group-hover:text-gray-900 transition-colors line-clamp-1 truncate capitalize">
          <HighlightMatch text={product.name.toLowerCase()} query={searchQuery} />
        </h3>
        
        <div className="flex items-center gap-1.5 mt-0.5 text-[16px] md:text-[17px] whitespace-nowrap overflow-hidden">
          {hasVariants && (
            <span className="text-[14px] md:text-[15px] font-normal text-gray-400 shrink-0">From</span>
          )}
          <span className="font-normal text-gray-950 shrink-0">
            {formatCurrency(displayPrice)}
          </span>
          
          {product.mrp && product.mrp > displayPrice && (
            <>
              <span className="text-[13px] md:text-[15px] text-gray-400 line-through font-normal shrink-0">
                {formatCurrency(product.mrp)}
              </span>
              <span className="text-[12px] md:text-[14px] font-normal text-emerald-600 shrink-0">
                {discountPct}% off
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}