// src/components/home/FeaturedProductsSection.tsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'

interface FeaturedProductsSectionProps {
  products: any[]
  title: string
}

export default function FeaturedProductsSection({ products, title }: FeaturedProductsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5)
      
      const scrollPercentage = scrollLeft / (scrollWidth - clientWidth || 1)
      setActiveIndex(Math.round(scrollPercentage * (products.length - 1)))
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

  const scrollToProduct = (index: number) => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current
      const targetScroll = (index / (products.length - 1)) * (scrollWidth - clientWidth)
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  if (!products || products.length === 0) return null

  return (
    <div className="w-full relative group/slider mb-4 bg-white py-0 px-1 select-none font-sans" suppressHydrationWarning>
      
      {/* 🚀 FIXED: Clean, Sentence-Cased Header Row matching Google/Studio Aesthetic */}
      <div className="flex items-baseline justify-between mb-4 px-1" suppressHydrationWarning>
        <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight">
          Featured Collections
        </h2>
        <Link 
          href="/products"
          className="flex items-center gap-1.5 group text-[14px] font-normal text-blue-600 hover:underline decoration-2 underline-offset-4">
          View all
        </Link>
      </div>
      
      <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 z-20 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 pr-0.5" strokeWidth={1.5} />
          </button>
        )}
        
        {/* Horizontal Slider Content Deck */}
        <div 
          ref={scrollContainerRef} 
          onScroll={checkScroll} 
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth snap-x snap-mandatory" 
          style={{ WebkitOverflowScrolling: 'touch' }} 
        >
          {products.map((product, index) => (
            <div key={product.id} className="w-[200px] sm:w-[260px] flex-shrink-0 h-full snap-start">
              <ProductCard 
                product={product} 
                priority={index < 2}
                searchQuery="" 
              />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 z-20 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 pl-0.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Mobile Pagination Dots */}
      {products.length > 1 && (canScrollRight || canScrollLeft) ? (
        <div className="flex sm:hidden justify-center gap-1.5 mt-4">
          {products.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => scrollToProduct(idx)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${activeIndex === idx ? 'w-4 bg-gray-900' : 'w-1 bg-gray-200'}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}