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
      <div className="w-full bg-white py-4 sm:py-6 mt-4">
        <h2 className="font-bold text-gray-900 text-lg sm:text-xl mb-4 leading-tight">Customers who viewed this item also viewed</h2>
        <div className="flex gap-4 overflow-hidden pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse w-[200px] sm:w-[240px] flex-shrink-0 bg-white p-4">
              <div className="aspect-square bg-gray-100 rounded-sm mb-4"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="w-full bg-white py-4 sm:py-6 mt-4 relative">
      <div className="mb-5 pb-3">
        <h2 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight">Customers who viewed this item also viewed</h2>
      </div>
      
      <div className="relative group/slider">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[40%] -translate-y-1/2 -ml-3 sm:-ml-5 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 pr-0.5" />
          </button>
        )}
        
        <div ref={scrollContainerRef} onScroll={checkScroll} className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-6 scroll-smooth snap-x">
          {products.map((product) => (
            <div key={product.id} className="w-[200px] sm:w-[240px] flex-shrink-0 h-full snap-start">
              <ProductCard product={product} productList={products} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 -mr-3 sm:-mr-5 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 pl-0.5" />
          </button>
        )}
      </div>
    </div>
  )
}