// src/components/home/FeaturedProductsSection.tsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ProductCard, { Product } from '@/components/product/ProductCard'

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
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = Math.min(scrollContainerRef.current.clientWidth * 0.8, 800)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(checkScroll, 350)
    }
  }

  if (!products || products.length === 0) return null

  return (
    <div className="w-full relative group/slider mb-10 bg-white p-4 sm:p-5 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-4 px-1 pb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F1111] tracking-tight">{title}</h2>
        <Link href="/products" target="_blank" rel="noopener noreferrer" 
        className="text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
          See all deals
        </Link>
      </div>
      
      <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0 -mt-5">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[40%] -translate-y-1/2 -ml-3 sm:-ml-5 z-20 w-11 h-11 bg-white/95 backdrop-blur rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-[#D5D9D9] flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none hidden sm:flex transition-all duration-200 opacity-0 group-hover/slider:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 pr-0.5" />
          </button>
        )}
        
        <div 
          ref={scrollContainerRef} 
          onScroll={checkScroll} 
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-6 pt-2 scroll-smooth snap-x snap-mandatory" 
          style={{ WebkitOverflowScrolling: 'touch' }} 
        >
          {products.map((product, index) => (
            <div key={product.id} className="w-[220px] sm:w-[240px] flex-shrink-0 h-full snap-start">
              <ProductCard 
                product={product} 
                priority={index < 2}
                productList={products} 
              />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 -mr-3 sm:-mr-5 z-20 w-11 h-11 bg-white/95 backdrop-blur rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-[#D5D9D9] flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none hidden sm:flex transition-all duration-200 opacity-0 group-hover/slider:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 pl-0.5" />
          </button>
        )}
      </div>
    </div>
  )
}