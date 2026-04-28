// src/components/product/ProductHorizontalCard.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Share2, Heart } from 'lucide-react'
import { getPublicUrl } from '@/lib/supabase/storage'
import StarRating from '@/components/product/StarRating'
import AddToCartButton from '@/components/product/AddToCartButton'
import { formatCurrency } from '@/lib/utils'
import { siteConfig } from '@/config/site'
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
          <span key={i} className="bg-yellow-200 text-gray-900 font-bold px-0.5 rounded-sm">{part}</span>
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
    price: number
    selling_price?: number | null
    bulk_price?: number | null
    images: string[]
    stock: number
    rating?: number | null
    review_count?: number | null
  }
  priority?: boolean
  searchQuery?: string
}

export default function ProductHorizontalCard({ product, priority = false, searchQuery = '' }: ProductHorizontalCardProps) {
  const router = useRouter()
  
  const rawImage = product.images?.[0]
  const imageUrl = !rawImage 
    ? '/placeholder-product.svg' 
    : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

  const sellingPrice = product.selling_price ?? product.price ?? 0
  const regularPrice = product.price ?? 0
  const hasDiscount = regularPrice > sellingPrice
  const isOutOfStock = product.stock <= 0

  const rating = product.rating ?? 4.5;
  const reviewCount = product.review_count ?? 128;

  const { savedProductIds, toggleItem } = useWishlistStore()
  const isSaved = savedProductIds.includes(product.id)

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await toggleItem(product.id)
      showToast(isSaved ? 'Removed from Wishlist' : 'Saved to Wishlist', 'success')
    } catch (error: any) {
      if (error.message === 'unauthorized') {
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        router.push(`/login?redirect=${currentUrl}`)
      } else {
        showToast('Failed to update wishlist', 'error')
      }
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/product/${product.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }) } catch (err) {}
    } else {
      navigator.clipboard.writeText(url)
      alert('Product link copied to clipboard!')
    }
  }

  return (
    <div className="bg-white p-3 border-b border-gray-200 flex flex-row gap-3 overflow-hidden shadow-sm rounded-sm relative">
      
      <Link href={`/product/${product.slug}`} className="block shrink-0 relative w-[120px] h-[120px] bg-[#F8F8F8] rounded-sm overflow-hidden p-2 flex items-center justify-center">
        <div className="w-full h-full relative">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="120px"
            unoptimized={imageUrl.startsWith('http') || imageUrl.includes('supabase')}
            className="object-contain mix-blend-multiply"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        </div>
      </Link>
      
      <div className="flex flex-col flex-1 justify-between min-w-0 pr-8">
        <button 
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 p-1"
          title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-6 h-6 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
        </button>

        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2 leading-snug mb-1 pr-2">
              <HighlightMatch text={product.name} query={searchQuery} />
            </h3>
          </Link>

          <div className="mb-1">
            <StarRating rating={rating} reviewCount={reviewCount} size="sm" />
          </div>
          
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(sellingPrice)}
              </span>
            </div>
            {hasDiscount && (
              <span className="text-xs text-gray-500">
                M.R.P: <span className="line-through">{formatCurrency(regularPrice)}</span> ({Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)}% off)
              </span>
            )}
            <div className="text-xs text-gray-900 mt-0.5">
              FREE Delivery by <span className="font-bold">{siteConfig.shortName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {isOutOfStock ? (
            <span className="text-xs font-bold text-[#B12704]">Currently unavailable.</span>
          ) : product.stock <= 5 ? (
            <span className="text-xs font-bold text-[#B12704]">Only {product.stock} left in stock - order soon.</span>
          ) : null}
          
          <div className="w-full flex gap-2">
            <AddToCartButton 
              product={product as any} 
              className="flex-1 h-8 text-sm bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] rounded-full shadow-sm"
            />
            <button 
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border border-gray-300 transition-colors shrink-0"
              title="Share this product"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}