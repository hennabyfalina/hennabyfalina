// src/components/cart/CartRecommendations.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cart.store'
import { getProductsByCategoryWithSignedUrls } from '@/services/product.service'
import { ShoppingBag, Star, StarHalf } from 'lucide-react'
import AddToCartButton from '@/components/product/AddToCartButton'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  selling_price?: number
  images: string[]
  category_id?: string | null
}

export default function CartRecommendations() {
  const items = useCartStore((state) => state.items)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (items.length === 0) {
        setRecommendations([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // Get unique category IDs from cart items
        const categoryIds = [...new Set(
          items
            .map(item => item.category_id)
            .filter((id): id is string => id !== null && id !== undefined)
        )]

        if (categoryIds.length === 0) {
          setRecommendations([])
          setLoading(false)
          setDebugInfo({ reason: 'No category IDs in cart items' })
          return
        }

        // Fetch products from each category
        const allProducts: Product[] = []
        
        for (const categoryId of categoryIds) {
          const products = await getProductsByCategoryWithSignedUrls(categoryId)
          allProducts.push(...products)
        }

        // Remove duplicates and exclude items already in cart
        const cartProductIds = new Set(items.map(item => item.product_id))
        
        const uniqueProducts = allProducts
          .filter(product => !cartProductIds.has(product.id))
          .filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
          )
          .slice(0, 6)

        setRecommendations(uniqueProducts)
        setDebugInfo({ 
          categoryIds,
          totalFetched: allProducts.length,
          recommendationsCount: uniqueProducts.length,
          cartItemsCount: items.length
        })
        
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
      <div className="mt-6 w-full bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Recommended for you</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-36 flex-shrink-0 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-sm"></div>
              <div className="h-3 bg-gray-200 rounded mt-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mt-1 w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="mt-6 w-full bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {items.length === 1 
              ? "We're working on finding more products like this one. Check back soon!"
              : "We'll show recommendations based on items in your cart. Add more products to see suggestions."}
          </p>
          <Link
            href="/products"
            className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 rounded-sm font-medium text-sm transition-colors border border-[#FCD200]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 w-full bg-white p-5 md:p-6 rounded-md border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-900 text-lg mb-4">Recommended for you</h3>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {recommendations.map((product) => {
          const displayPrice = product.selling_price ?? product.price ?? 0
          const imageUrl = product.images?.[0] || '/placeholder-product.svg'
          
          return (
            <div
              key={product.id}
              className="group w-44 sm:w-48 flex-shrink-0 snap-start flex flex-col bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-1 mb-3">
                <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden relative border border-gray-100 mb-2">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="144px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={imageUrl.includes('token=') || imageUrl.includes('supabase')}
                  />
                </div>
                <p className="text-xs font-medium text-[#007185] group-hover:text-[#C7511F] group-hover:underline transition-colors line-clamp-2 leading-snug mb-1">
                  {product.name}
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
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ₹{displayPrice.toFixed(2)}
                </p>
              </Link>
              <div className="mt-auto w-full">
                <AddToCartButton product={product as any} showQuantitySelector={false} />
              </div>
            </div>
          )
        })}
      </div>
      
      
    </div>
  )
}