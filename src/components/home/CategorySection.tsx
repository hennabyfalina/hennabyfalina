// src/components/home/CategorySection.tsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  image?: string | null
  product_count?: number
}

interface CategorySectionProps {
  categories: Category[]
}

export default function CategorySection({ categories }: CategorySectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5)
      
      const scrollPercentage = scrollLeft / (scrollWidth - clientWidth)
      setActiveIndex(Math.round(scrollPercentage * (categories.length - 1)))
    }
  }

  useEffect(() => {
    checkScroll()
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
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

  const scrollToCategory = (index: number) => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current
      const targetScroll = (index / (categories.length - 1)) * (scrollWidth - clientWidth)
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-white pt-6 pb-2 px-1 w-full font-sans select-none" suppressHydrationWarning>
      <div className="flex items-baseline justify-between mb-8" suppressHydrationWarning>
        <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight">
          Shop by Category
        </h2>
        <Link 
          href="/products" 
          className="flex items-center gap-1.5 group text-[14px] font-normal text-blue-600 hover:underline decoration-2 underline-offset-4 text-decoration-none outline-none"
        >
          See all
        </Link>
      </div>

      <div className="relative group/slider" suppressHydrationWarning>
        {canScrollLeft && !isTouchDevice && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 z-20 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-sm border-solid outline-none"
            aria-label="Scroll left" 
          >
            <ChevronLeft className="w-4 h-4 pr-0.5" strokeWidth={1.5} />
          </button>
        )}
        
        <div 
          ref={scrollContainerRef} 
          onScroll={checkScroll} 
          className="flex overflow-x-auto gap-6 sm:gap-10 no-scrollbar pb-4 scroll-smooth items-start snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
          suppressHydrationWarning
        >
          {categories.map((category) => {
            // ✅ CRITICAL CLEANUP: URLs are pre-resolved directly from the service boundary layer
            const imgUrl = category.image || '/placeholder-category.svg'
            
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.slug || category.id}`}
                className="flex flex-col items-center gap-3.5 group min-w-[96px] sm:min-w-[120px] flex-shrink-0 snap-center text-decoration-none outline-none"
              >
                <div className="w-[92px] h-[92px] sm:w-[112px] sm:h-[112px] rounded-full bg-stone-50/40 border border-solid border-gray-100 overflow-hidden relative flex items-center justify-center transition-all duration-300 group-hover:border-gray-300 group-hover:bg-white" suppressHydrationWarning>
                  <div className="relative w-full h-full p-2" suppressHydrationWarning>
                    <Image
                      src={imgUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 80px, 96px"
                      className="object-contain p-1 transition-transform duration-500 ease-out group-hover:scale-105"
                      unoptimized={imgUrl.includes('token=') || imgUrl.includes('supabase')}
                    />
                  </div>
                </div>
                
                <span className="text-[14px] sm:text-[15px] font-normal text-gray-600 text-center line-clamp-1 truncate group-hover:text-gray-950 transition-colors capitalize">
                  {category.name.toLowerCase()}
                </span>
              </Link>
            )
          })}
        </div>

        {canScrollRight && !isTouchDevice && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 z-20 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-sm border-solid outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 pl-0.5" strokeWidth={1.5} />
          </button>
        )}

        {categories.length > 1 && (canScrollRight || canScrollLeft) ? (
          <div className="flex sm:hidden justify-center gap-1.5 mt-2">
            {categories.map((_, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => scrollToCategory(idx)}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer border-none outline-none ${activeIndex === idx ? 'w-4 bg-gray-900' : 'w-1 bg-gray-200'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}