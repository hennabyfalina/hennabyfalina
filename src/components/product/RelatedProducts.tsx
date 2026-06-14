// src/components/product/RelatedProducts.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getRelatedProductsWithSignedUrls } from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard' 

interface RelatedProductsProps {
  currentProductId: string
  categoryId: string | null
}

export default function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRelatedProductsWithSignedUrls(currentProductId, categoryId, 8)
        setProducts(data)
      } catch (error) {
        console.error('Failed to load related products', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentProductId, categoryId])

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

  if (loading) {
    return (
      <div className="w-full bg-white py-6 relative select-none">
        <div className="mb-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-normal text-gray-950 tracking-tight capitalize">
          People Also Bought
          </h2>
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-hidden pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse w-[200px] sm:w-[240px] flex-shrink-0 space-y-4">
              <div className="aspect-[4/5] bg-stone-50 rounded-2xl"></div>
              <div className="h-4 bg-stone-50 rounded-md w-3/4"></div>
              <div className="h-4 bg-stone-50 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="w-full bg-white py-6 relative select-none animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-normal text-gray-950 tracking-tight capitalize">
          People Also Bought
        </h2>
      </div>
      
      <div className="relative group/slider">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[45%] -translate-y-1/2 -ml-5 z-20 w-9 h-9 bg-white/90 backdrop-blur border border-gray-100 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 pr-0.5" strokeWidth={1.5} />
          </button>
        )}
        
        <div ref={scrollContainerRef} onScroll={checkScroll} className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x">
          {products.map((product) => (
            <div key={product.id} className="w-[200px] sm:w-[240px] flex-shrink-0 h-full snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[45%] -translate-y-1/2 -mr-5 z-20 w-9 h-9 bg-white/90 backdrop-blur border border-gray-100 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 pl-0.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}