// src/components/product/RelatedProducts.tsx

'use client'

import { useState, useEffect } from 'react'
import { getRelatedProductsWithSignedUrls } from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard' // ✅ Reusing your main ProductCard

interface RelatedProductsProps {
  currentProductId: string
  categoryId: string | null
}

export default function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Our upgraded service handles the Smart Fallback automatically!
        const data = await getRelatedProductsWithSignedUrls(currentProductId, categoryId, 6)
        setProducts(data)
      } catch (error) {
        console.error('Failed to load related products', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentProductId, categoryId])

  if (loading) {
    return (
      <div className="pb-8">
        <h2 className="font-bold text-gray-900 text-lg mb-4">Customers who viewed this item also viewed</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse w-[220px] flex-shrink-0">
              <div className="aspect-square bg-gray-100 rounded-sm mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="pb-8">
      <h2 className="font-bold text-gray-900 text-lg mb-4">Customers who viewed this item also viewed</h2>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x">
        {products.map((product) => (
          <div key={product.id} className="w-[220px] flex-shrink-0 snap-start h-full">
             {/* Reusing the exact logic and design of your main ProductCard */}
            <ProductCard product={product} priority={false} productList={products} />
          </div>
        ))}
      </div>
    </div>
  )
}