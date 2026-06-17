// src/components/product/RecentlyBoughtCarousel.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'
import { useAuth } from '@/hooks/useAuth'
import type { Product } from '@/types/database.types'

function ProductCardSkeleton() {
  return (
    <div className="w-[200px] sm:w-[240px] flex-shrink-0 h-full animate-pulse">
      <div className="aspect-square bg-gray-100 rounded-2xl" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-50 rounded w-1/2" />
        <div className="h-5 bg-gray-100 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}

export default function RecentlyBoughtCarousel() {
  const { user, isLoading: authLoading } = useAuth()
  const [recentlyBought, setRecentlyBought] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const fetchRecentlyBought = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await fetch('/api/user/recently-bought')
        if (response.ok) {
          const products: Product[] = await response.json()
          setRecentlyBought(Array.isArray(products) ? products : [])
        } else {
          setRecentlyBought([])
        }
      } catch (error) {
        console.error('Error fetching recently bought products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentlyBought()
  }, [user?.id])

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
  }, [recentlyBought])

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

  if (authLoading || !user) return <div className="h-0 overflow-hidden" />;

  if (loading) {
    return (
      <div className="w-full bg-white py-4 px-1 select-none">
        <div className="flex items-baseline justify-between mb-6">
          <div className="h-8 w-40 bg-gray-100 rounded-md animate-pulse" />
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!recentlyBought || recentlyBought.length === 0) return null

  return (
    <div className="w-full bg-white py-4 px-1 select-none font-sans relative group/slider">
      
      {/* Clean, Sentence‑Cased Header Row */}
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight">
          Buy it again
        </h2>
        <Link 
          href="/profile/orders"
          className="flex items-center gap-1.5 group text-[14px] font-normal text-blue-600 hover:underline decoration-2 underline-offset-4">
          View orders
        </Link>
      </div>
      
      <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0">
        {canScrollLeft && (
          <button 
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 z-20 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-none outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 pr-0.5" strokeWidth={1.5} />
          </button>
        )}
        
        {/* Horizontal Scroller */}
        <div 
          ref={scrollContainerRef} 
          onScroll={checkScroll} 
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2 scroll-smooth snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {recentlyBought.map((product, index) => (
            <div key={product.id} className="w-[200px] sm:w-[260px] flex-shrink-0 h-full snap-start">
              <ProductCard 
                product={product as any} 
                priority={index < 2}
                searchQuery="" 
              />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 z-20 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-none outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 pl-0.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}