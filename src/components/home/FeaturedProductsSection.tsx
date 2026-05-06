// src/components/home/FeaturedProductsSection.tsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!products.length) return null

  return (
    <div className="bg-white p-4 sm:p-5 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)]" suppressHydrationWarning>
      <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{title}</h2>
        <Link href="/products" target="_blank" rel="noopener noreferrer" 
        className="text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
          See all deals
        </Link>
      </div>

      <div className="relative group" suppressHydrationWarning>
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[40%] -translate-y-1/2 -ml-2 sm:-ml-4 z-10 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none hidden sm:flex transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
          <div ref={scrollContainerRef} onScroll={checkScroll} className="flex gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }} suppressHydrationWarning>
          {products.map((product) => (
            <div key={product.id} className="w-[220px] flex-shrink-0 h-full" suppressHydrationWarning>
              <ProductCard product={product} priority={false} productList={products} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 -mr-2 sm:-mr-4 z-10 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none hidden sm:flex transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  )
}