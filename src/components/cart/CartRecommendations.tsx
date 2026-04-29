// src/components/cart/CartRecommendations.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart.store'
import { getCartRecommendationsWithSignedUrls } from '@/services/product.service'
import { ShoppingBag } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard' // ✅ Reusing your main ProductCard

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

  if (loading) {
    return (
      <div className="mt-8 w-full bg-white p-5 md:p-6 rounded-sm border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Recommmended for you</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[220px] flex-shrink-0 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-sm"></div>
              <div className="h-4 bg-gray-100 rounded mt-3 w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded mt-2 w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="mt-8 w-full bg-white p-5 md:p-6 rounded-sm border border-gray-200 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Keep exploring</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            Add items to your cart to see personalized recommendations.
          </p>
          <Link
            href="/products"
            className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 rounded-sm font-bold text-sm transition-colors border border-[#FCD200] shadow-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 w-full bg-white p-5 md:p-6 rounded-sm border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-900 text-xl mb-6 tracking-tight">Recommended for you</h3>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
        {recommendations.map((product) => (
          <div key={product.id} className="w-[220px] flex-shrink-0 snap-start h-full">
            {/* ✅ Reusing the exact logic and design of your main ProductCard */}
            <ProductCard product={product} priority={false} productList={recommendations} />
          </div>
        ))}
      </div>
    </div>
  )
}