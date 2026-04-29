// src/components/home/FeaturedProductsSection.tsx

'use client'

import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  selling_price?: number | null
  bulk_price?: number | null
  bulk_min_quantity?: number | null
  description?: string | null
  images: string[]
  stock: number
  rating?: number | null
  review_count?: number | null
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

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x">
        {products.map((product) => (
          <div key={product.id} className="w-[220px] flex-shrink-0 snap-start h-full">
            <ProductCard product={product} priority={false} productList={products} />
          </div>
        ))}
      </div>
    </div>
  )
}