// src/components/product/RecentlyViewed.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'

interface ViewedProduct {
  id: string
  name: string
  slug: string
  price: number
  image: string
  images?: string[]
  original_price?: number
  selling_price?: number
  description?: string | null
  stock?: number
  rating?: number | null
  review_count?: number | null
  pricing_tiers?: any[]
  min_order_qty?: number
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
        setRecentItems(items.slice(0, 6)) 
      } catch (e) {
        console.error('Error parsing recently viewed', e)
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div className="w-full mt-4 pb-8 min-h-[300px]">
        <div className="h-6 w-48 bg-gray-100 animate-pulse rounded mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[200px] h-[300px] bg-gray-50 animate-pulse rounded-lg shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  if (recentItems.length === 0) {
    return (
      <div className="w-full mt-2 bg-white rounded-lg p-6 sm:p-8 text-center border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <Eye className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">No recently viewed items</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Products you view will be saved here so you can easily find them later.</p>
        <div>
          <Link 
            href="/products"
            className="inline-flex py-2.5 px-6 bg-white hover:bg-gray-50 text-[#0F1111] rounded-sm font-bold text-sm transition-colors border border-[#D5D9D9] shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mt-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-gray-900 text-lg">Recently Viewed</h3>
      </div>
      
      <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-6 scroll-smooth snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
        {recentItems.map((prod, _, arr) => {
          const mappedList = arr.map(p => ({
            id: p.id,
            name: p.name || '',
            slug: p.slug,
            price: p.price,
            selling_price: p.selling_price,
            description: p.description,
            images: p.images && p.images.length > 0 ? p.images : [p.image],
            stock: p.stock ?? 100, 
            rating: p.rating ?? 4.5,
            review_count: p.review_count ?? 128,
            pricing_tiers: p.pricing_tiers,
            min_order_qty: p.min_order_qty ?? 100
          }))
          const mappedProduct = mappedList.find(p => p.id === prod.id)!
          
          return (
            <div key={prod.id} className="w-[200px] sm:w-[240px] flex-shrink-0 h-full snap-start">
              <ProductCard 
                product={mappedProduct} 
                productList={mappedList} 
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}