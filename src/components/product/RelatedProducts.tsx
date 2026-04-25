// src/components/product/RelatedProducts.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRelatedProductsWithSignedUrls } from '@/services/product.service'
import { Product } from '@/types/database.types'
import { Star, StarHalf } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import AddToCartButton from '@/components/product/AddToCartButton'

interface RelatedProductsProps {
  currentProductId: string
  categoryId: string | null
}

export default function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!categoryId) {
        setLoading(false)
        return
      }
      try {
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
      <div className="py-4">
        <h2 className="text-lg font-bold text-[#CC6600] mb-4">Customers who viewed this item also viewed</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse w-[160px] flex-shrink-0">
              <div className="aspect-square bg-gray-200 rounded-sm mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-[#CC6600] mb-4">Customers who viewed this item also viewed</h2>
      
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
        {products.map((product) => {
          const sellingPrice = product.selling_price ?? product.price ?? 0
          const imageUrl = product.images?.[0] || '/placeholder-product.svg'
          
          return (
            <div key={product.id} className="group w-[180px] sm:w-[220px] flex-shrink-0 snap-start flex flex-col bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md hover:border-blue-200 transition-all">
              <Link href={`/product/${product.slug}`} className="flex flex-col flex-1 mb-3">
                <div className="aspect-square bg-white border border-gray-100 rounded-sm overflow-hidden relative mb-2 flex items-center justify-center p-2">
                  <div className="w-full h-full relative">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 160px, 200px"
                      className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                <h3 className="text-xs font-medium text-[#007185] group-hover:text-[#C7511F] group-hover:underline transition-colors line-clamp-2 leading-snug mb-1">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-1 mb-1">
                  <div className="flex text-[#FFA41C]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <StarHalf className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-[11px] text-[#007185]">4.5</span>
                </div>
                
                <div className="text-[#B12704] font-medium text-lg mt-1">
                  {formatCurrency(sellingPrice)}
                </div>
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