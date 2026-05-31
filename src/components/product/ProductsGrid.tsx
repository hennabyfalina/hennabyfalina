// src/components/product/ProductsGrid.tsx

'use client'

import { memo } from 'react'
import ProductCard from './ProductCard'
import ProductHorizontalCard from './ProductHorizontalCard'
import type { Product } from '@/app/(shop)/products/ProductsClientView'
import { useSearchParams } from 'next/navigation'

interface ProductsGridProps {
  products: Product[]
}

const ProductsGrid = memo(function ProductsGrid({ products }: ProductsGridProps) {
  const searchParams = useSearchParams()
  const searchQuery = searchParams ? (searchParams.get('q') || searchParams.get('search') || '') : ''

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
      {products.map((product, index) => (
        <div key={product.id} className="h-full">
          <div className="hidden sm:block h-full">
            <ProductCard product={product} priority={index < 4} searchQuery={searchQuery} productList={products} />
          </div>
          <div className="block sm:hidden">
            <ProductHorizontalCard product={product} priority={index < 2} searchQuery={searchQuery} productList={products} />
          </div>
        </div>
      ))}
    </div>
  )
})

export default ProductsGrid;