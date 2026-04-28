// src/components/product/RecentlyViewed.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { History, Eye } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'

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
  stock?: number
  rating?: number | null
  review_count?: number | null
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
        setRecentItems(items.slice(0, 6)) // Load up to 6 items to fill the shelf
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
            <div key={i} className="w-[220px] flex-shrink-0 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-sm mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recentItems.length === 0) {
    return (
      <div className="w-full text-center py-8 bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No recently viewed items</h3>
          <p className="text-sm text-gray-600 mb-4">
            Products you view will automatically appear here.
          </p>
          <Link
            href="/products"
            className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 rounded-sm font-bold text-sm transition-colors border border-[#FCD200] shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mt-4">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-[#C7511F]" />
        <h3 className="font-bold text-gray-900 text-xl tracking-tight">Recently Viewed</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
        {recentItems.map((prod) => {
          // Map the local storage data precisely to the shape ProductCard expects
          const mappedProduct = {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            price: prod.price,
            selling_price: prod.selling_price,
            bulk_price: prod.bulk_price,
            bulk_min_quantity: prod.bulk_min_quantity,
            description: prod.description,
            images: [prod.image],
            stock: prod.stock ?? 99, 
            rating: prod.rating ?? 4.5,
            review_count: prod.review_count ?? 128
          }

          return (
            <div key={prod.id} className="w-[220px] flex-shrink-0 snap-start h-full">
              <ProductCard product={mappedProduct} priority={false} />
            </div>
          )
        })}
      </div>
    </div>
  )
}