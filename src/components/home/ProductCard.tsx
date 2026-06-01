// src/components/home/ProductCard.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    stock: number
  }
  searchQuery?: string
  priority?: boolean
}

export default function ProductCard({ product, searchQuery = '', priority = false }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const imageUrl = product.images?.[0]
  const finalImageUrl = imgError || !imageUrl 
    ? '/placeholder-product.svg' 
    : imageUrl

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = `${window.location.origin}/product/${product.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Product link copied to clipboard!')
    }
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block bg-white rounded-sm p-2.5 sm:p-4 border border-gray-200 hover:border-gray-300 hover:shadow-[0_8px_25px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative z-10 hover:z-20">
      <div className="space-y-3 sm:space-y-4">
        {/* Image container */}
        <div className="aspect-square bg-gray-50/50 rounded-xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={finalImageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgError(true)
              setIsLoading(false)
            }}
          />
          <button
            onClick={handleShare}
            className="absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full shadow-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Share product"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Product info */}
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
            <HighlightMatch text={product.name} query={searchQuery} />
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.stock <= 0 && (
              <span className="text-[11px] sm:text-sm font-medium text-red-600">Out of stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}