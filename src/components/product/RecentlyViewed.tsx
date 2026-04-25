// src/components/product/RecentlyViewed.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { History, Eye, Star, StarHalf } from 'lucide-react'
import { getPublicUrl } from '@/lib/supabase/storage'
import AddToCartButton from '@/components/product/AddToCartButton'

interface ViewedProduct {
  id: string
  name: string
  slug: string
  price: number
  image: string
  original_price?: number
  selling_price?: number
  bulk_price?: number | null
  bulk_min_quantity?: number | null
  description?: string | null
}

export default function RecentlyViewed() {
  const [recentItems, setRecentItems] = useState<ViewedProduct[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('razack_recently_viewed')
    if (stored) {
      try {
        const items = JSON.parse(stored)
        setRecentItems(items.slice(0, 5))
      } catch (e) {
        console.error('Error parsing recently viewed', e)
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="flex gap-4 pb-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-36 flex-shrink-0 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recentItems.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No recently viewed items</h3>
          <p className="text-sm text-gray-600 mb-4">
            Products you view will appear here
          </p>
          <Link
            href="/products"
            className="px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 rounded-sm font-medium text-sm transition-colors border border-[#FCD200]"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-gray-900 text-lg md:text-xl tracking-tight">Recently Viewed</h3>
      </div>
      
      <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4 sm:pb-0 snap-x no-scrollbar">
        {recentItems.map((prod) => {
          let imageUrl = '/placeholder-product.svg'
          if (prod.image) {
            imageUrl = prod.image.startsWith('http') || prod.image.startsWith('/') 
              ? prod.image 
              : getPublicUrl(prod.image)
          }
          
          return (
            <div 
              key={prod.id} 
              className="group w-44 sm:w-48 flex-shrink-0 snap-start flex flex-col bg-white p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"
            >
              <Link href={`/product/${prod.slug}`} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-1 mb-3">
                <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 mb-2">
                  <Image 
                    src={imageUrl}
                    alt={prod.name} 
                    fill 
                    sizes="(max-width: 768px) 144px, 200px"
                    className="object-cover group-hover:scale-105 transition-transform" 
                    unoptimized={imageUrl.includes('token=') || imageUrl.includes('supabase')}
                  />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-xs font-medium text-[#007185] group-hover:text-[#C7511F] group-hover:underline transition-colors line-clamp-2 leading-snug mb-1">
                    {prod.name}
                  </p>
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex text-[#FFA41C]">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <StarHalf className="w-3 h-3 fill-current" />
                    </div>
                    <span className="text-[10px] text-[#007185]">4.5</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mt-1">₹{(prod.selling_price ?? prod.price).toFixed(2)}</p>
                </div>
              </Link>
              <div className="mt-auto w-full">
                <AddToCartButton product={{
                  id: prod.id,
                  name: prod.name,
                  slug: prod.slug,
                  price: prod.price,
                  selling_price: prod.selling_price,
                  bulk_price: prod.bulk_price,
                  bulk_min_quantity: prod.bulk_min_quantity,
                  description: prod.description,
                  images: [prod.image],
                  stock: 99,
                  category_id: null
                } as any} showQuantitySelector={false} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}