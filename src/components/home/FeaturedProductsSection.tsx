// src/components/home/FeaturedProductsSection.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, StarHalf } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import AddToCartButton from '@/components/product/AddToCartButton'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  selling_price: number
  bulk_price?: number | null
  images: string[]
  stock: number
}

interface FeaturedProductsSectionProps {
  products: Product[]
  title: string
}

export default function FeaturedProductsSection({ products, title }: FeaturedProductsSectionProps) {
  if (!products.length) return null

  return (
    <div className="bg-white p-4 sm:p-5 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
        <Link href="/products" target="_blank" rel="noopener noreferrer" className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline">
          See all deals
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
        {products.map((product) => {
          const sellingPrice = product.selling_price ?? product.price ?? 0
          const regularPrice = product.price ?? 0
          const imageUrl = product.images?.[0] || '/placeholder-product.svg'
          
          return (
            <div key={product.id} className="group w-[160px] sm:w-[200px] flex-shrink-0 snap-start flex flex-col">
              <Link 
                href={`/product/${product.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block flex-1 flex flex-col"
              >
                <div className="aspect-square bg-gray-50 border border-gray-100 rounded-sm overflow-hidden relative mb-2 flex items-center justify-center p-2">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 160px, 200px"
                    unoptimized={imageUrl.includes('token=') || imageUrl.includes('supabase')}
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 p-2"
                  />
                </div>
                
                <h3 className="text-sm font-medium text-[#007185] group-hover:text-[#C7511F] group-hover:underline transition-colors line-clamp-2 leading-snug mb-1">
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
                
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-lg font-medium text-[#B12704]">{formatCurrency(sellingPrice)}</span>
                  {regularPrice > sellingPrice && (
                    <span className="text-xs text-gray-500 line-through">{formatCurrency(regularPrice)}</span>
                  )}
                </div>
              </Link>
              
              <div className="mt-2">
                <AddToCartButton 
                  product={product as any} 
                  className="w-full h-8 text-xs bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] rounded-full shadow-sm"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}