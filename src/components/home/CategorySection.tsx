// src/components/home/CategorySection.tsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/supabase/storage'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  product_count: number
}

interface CategorySectionProps {
  categories: Category[]
}

export default function CategorySection({ categories }: CategorySectionProps) {
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
  }, [categories])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="bg-white p-4 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)]" suppressHydrationWarning>
      <div className="flex items-center justify-between mb-6" suppressHydrationWarning>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
          Shop by Category
        </h2>
        <Link 
          href="/products" 
          className="text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
          See all
        </Link>
      </div>

      <div className="relative group/slider" suppressHydrationWarning>
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[40%] -translate-y-1/2 -ml-2 sm:-ml-4 z-10 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none hidden sm:flex transition-opacity opacity-0 group-hover/slider:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {/* 🚀 BUTTER-SMOOTH: Native scrolling enabled */}
        <div 
          ref={scrollContainerRef} 
          onScroll={checkScroll} 
          className="flex overflow-x-auto gap-4 sm:gap-6 no-scrollbar pb-2 scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
          suppressHydrationWarning
        >
          {categories.map((category) => {
            let imgUrl = '/placeholder-category.svg'
            if (category.image) {
              imgUrl = category.image.startsWith('http') 
                ? category.image 
                : getPublicUrl(category.image)
            }
            
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="flex flex-col items-center gap-3 group min-w-[100px] sm:min-w-[120px] flex-shrink-0"
              >
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#F7F8F8] border border-gray-100 overflow-hidden relative flex items-center justify-center transition-all duration-300 group-hover:border-[#FBD18E] group-hover:shadow-md" suppressHydrationWarning>
                  <div className="relative w-full h-full p-3" suppressHydrationWarning>
                    <Image
                      src={imgUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 80px, 112px"
                      className="object-contain transition-transform duration-500 group-hover:scale-110"
                      unoptimized={imgUrl.includes('token=') || imgUrl.includes('supabase')}
                    />
                  </div>
                </div>
                
                <span className="text-xs sm:text-sm font-medium text-gray-800 text-center line-clamp-2 leading-tight group-hover:text-[#C7511F] transition-colors">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 -mr-2 sm:-mr-4 z-10 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none hidden sm:flex transition-opacity opacity-0 group-hover/slider:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </section>
  )
}