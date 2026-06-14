// src/components/cart/CartRecommendations.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart.store'
import { getCartRecommendationsWithSignedUrls } from '@/services/product.service'
import { ShoppingBag } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'

export default function CartRecommendations() {
  const items = useCartStore((state) => state.items)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (items.length === 0) {
        setRecommendations([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const cartProductIds = items.map(item => item.product_id)
        const recommendedProducts = await getCartRecommendationsWithSignedUrls(cartProductIds, 6)
        setRecommendations(recommendedProducts)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [items])

  // 🚀 SKELETON LOADING STATE: Clean fixed-width elements matching layout standards
  if (loading) {
    return (
      <div className="mt-10 w-full select-none font-sans antialiased text-center flex flex-col items-center">
        <div className="h-5 w-44 bg-stone-100 rounded-md mb-8 animate-pulse" />
        <div className="flex gap-4 sm:gap-6 overflow-hidden w-full justify-start md:justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[180px] sm:w-[220px] flex-shrink-0 space-y-3 text-left">
              <div className="relative aspect-square w-full bg-stone-50/60 rounded-xl border border-gray-100/40" />
              <div className="px-1 space-y-2">
                <div className="h-4 bg-stone-50/80 rounded-md w-11/12" />
                <div className="h-4 bg-stone-50 rounded-md w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 🚀 EMPTY STATE: Flat open structure built to rest directly onto your container workspace
  if (recommendations.length === 0) {
    return (
      <div className="w-full mt-10 py-12 text-center select-none font-sans antialiased flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full bg-stone-50/60 flex items-center justify-center border border-gray-100/50 text-gray-400">
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h3 className="text-[15px] font-normal text-gray-950 lowercase">
            keep exploring
          </h3>
          <p className="text-[13px] text-gray-400 font-normal max-w-sm mx-auto leading-relaxed lowercase">
            add items to your bag session to reveal custom curated matching organic products.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center px-6 bg-gray-950 hover:bg-black text-white rounded-xl text-[13px] font-medium transition-colors cursor-pointer lowercase shadow-xs active:scale-[0.99]"
          >
            continue shopping
          </Link>
        </div>
      </div>
    )
  }

  // 🚀 ACTIVE SHOWCASE STATE: Clean horizontal swiper row using exact homepage dimensions
  return (
    <div className="mt-10 w-full select-none font-sans antialiased flex flex-col gap-6" suppressHydrationWarning>
      
      {/* Centered, weightless medium text heading label */}
      <div className="w-full text-center py-2 flex flex-col items-center justify-center">
        <h3 className="text-3xl sm:text-4xl font-normal text-gray-950 tracking-tight capitalize">
          Recommended For You
        </h3>
      </div>

      {/* 🌟 FIXED: Changed grid to an infinite scroll row track to prevent image stretching */}
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scroll-smooth no-scrollbar snap-x snap-mandatory w-full justify-start md:justify-center">
        {recommendations.slice(0, 6).map((product) => (
          <div 
            key={product.id} 
            className="w-[180px] sm:w-[220px] flex-shrink-0 snap-start px-0.5"
          >
            <ProductCard product={product} priority={false} />
          </div>
        ))}
      </div>
      
    </div>
  )
}