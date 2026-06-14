// src/components/product/ProductHorizontalCard.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star } from 'lucide-react'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import { useWishlistStore } from '@/store/wishlist.store'
import { showToast } from '@/components/ui/Toast'

function HighlightMatch({ text, query }: { text: string, query: string }) {
  if (!query) return <span>{text}</span>;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeQuery})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-amber-100 text-gray-900 font-medium px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

interface ProductHorizontalCardProps {
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    stock: number
    rating?: number | null
    review_count?: number | null
    sku?: string | null
    category_id?: string | null
    is_active: boolean
    is_deleted: boolean
    retail_price: number
    wholesale_price: number
    wholesale_min_qty: number
    mrp?: number
  }
  priority?: boolean
  searchQuery?: string
  productList?: any[]
}

export default function ProductHorizontalCard({ 
  product, 
  priority = false, 
  searchQuery = '' 
}: ProductHorizontalCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const isOutOfStock = (product.stock ?? 0) <= 0

  const displayPrice = product.retail_price ?? 0
  const mrp = product.mrp ?? 0
  const discountPct = mrp > displayPrice ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0

  const rawImage = product.images?.[0]
  const imageUrl = !rawImage 
    ? '/placeholder-product.svg' 
    : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

  const { savedProductIds, toggleItem } = useWishlistStore()
  const isSaved = savedProductIds.includes(product.id)

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const willBeSaved = !isSaved
    showToast(willBeSaved ? 'Added to Wishlist' : 'Removed from Wishlist', 'success')
    try {
      await toggleItem(product.id)
    } catch (error: any) {
      console.error('Failed to patch wishlist state context', error)
    }
  }

  return (
    <Link href={`/product/${product.slug}`} className="bg-white p-4 flex flex-row gap-4 overflow-hidden relative border-b border-gray-100/70 w-full items-start group">
      
      {/* HORIZONTAL LEFT MEDIA CONTAINER */}
      <div className="relative shrink-0 w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] bg-stone-50/50 rounded-lg overflow-hidden p-1 flex items-center justify-center">
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white text-gray-900 border border-gray-900 text-[9px] tracking-widest font-medium px-1.5 py-1 rounded-sm">
              SOLD OUT
            </span>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50/50 z-10">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          </div>
        )}

        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 110px, 130px"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          unoptimized={imageUrl.startsWith('http') || imageUrl.includes('supabase')}
        />
      </div>
      
      {/* HORIZONTAL RIGHT TEXT SUMMARY PANEL */}
      <div className="flex flex-col flex-grow justify-between min-w-0 pr-6 self-stretch pt-0.5">
        <button 
          onClick={handleWishlist}
          className="absolute top-4 right-4 z-30 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-gray-300 hover:text-red-500 transition-all cursor-pointer active:scale-90"
          title="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} strokeWidth={1.5} />
        </button>

        <div>
          <h3 className="text-[14px] font-medium tracking-wide text-gray-800 group-hover:text-gray-900 line-clamp-2 leading-relaxed mb-1.5 pr-2 transition-colors">
            <HighlightMatch text={product.name} query={searchQuery} />
          </h3>

          <div className="mb-3 flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-800 px-1.5 py-0.5 rounded-[3px] text-[11px] font-medium">
              <span>{product.rating ?? 4.5}</span>
              <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" strokeWidth={0} />
            </div>
            <span className="text-[12px] text-gray-400 font-normal">({product.review_count ?? 128})</span>
          </div>
          
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[16px] sm:text-lg font-medium text-gray-900">{formatCurrency(displayPrice)}</span>
            {mrp > displayPrice && (
              <>
                <span className="text-xs text-gray-400 line-through font-normal">{formatCurrency(mrp)}</span>
                <span className="text-[12px] text-emerald-600 font-normal tracking-wide">{discountPct}% OFF</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}