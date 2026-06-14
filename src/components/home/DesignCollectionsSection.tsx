// src/components/home/DesignCollectionsSection.tsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Brush, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/supabase/storage'
import { createPortal } from 'react-dom'

interface DesignCollectionsSectionProps {
  collections: any[]
}

export default function DesignCollectionsSection({ collections }: DesignCollectionsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)

  const curatedPortfolios = collections && collections.length > 0 
    ? collections 
    : []

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5)
      
      const scrollPercentage = scrollLeft / (scrollWidth - clientWidth || 1)
      setActiveIndex(Math.round(scrollPercentage * (curatedPortfolios.length - 1)))
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

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
    <>
      {/* Full Screen Image Modal */}
      {selectedImage && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" strokeWidth={1.5} />
          </button>
          <div className="relative w-full h-full max-w-5xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <Image
              src={selectedImage.url}
              alt={selectedImage.name}
              fill
              className="object-contain"
              priority
            />
            <div className="absolute -bottom-12 left-0 right-0 text-center">
              <p className="text-white text-lg font-light tracking-wide capitalize">{selectedImage.name.toLowerCase()}</p>
            </div>
          </div>
        </div>,
        document.body
      )}

    <div className="w-full bg-white py-6 px-1 select-none font-sans text-left">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight">
          Design Portfolios
        </h2>
        <Link 
          href="/collections" 
          className="text-[15px] font-medium text-blue-600 hover:text-blue-700 transition-colors tracking-tight"
        >
          Explore gallery
        </Link>
      </div>

      <div className="relative group/slider">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 z-20 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 pr-0.5" strokeWidth={1.5} />
          </button>
        )}

        <div 
          ref={scrollContainerRef} 
          onScroll={checkScroll} 
          className="flex overflow-x-auto gap-6 sm:gap-10 no-scrollbar pb-4 scroll-smooth items-start snap-x snap-mandatory"
        >
          {curatedPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              onClick={() => {
                if (portfolio.image) {
                  const url = portfolio.image.startsWith('http') ? portfolio.image : getPublicUrl(portfolio.image)
                  setSelectedImage({ url, name: portfolio.name })
                }
              }}
              className="flex flex-col items-center gap-3.5 group min-w-[96px] sm:min-w-[120px] flex-shrink-0 snap-center cursor-pointer"
            >
              <div className="w-[92px] h-[92px] sm:w-[112px] sm:h-[112px] rounded-full bg-stone-50/40 border border-gray-100 overflow-hidden relative flex items-center justify-center transition-all duration-300 group-hover:border-gray-300 group-hover:bg-white">
                {portfolio.image ? (
                  <>
                  <div className="relative w-full h-full p-2">
                    <Image
                      src={portfolio.image.startsWith('http') ? portfolio.image : getPublicUrl(portfolio.image)}
                      alt={portfolio.name}
                      fill
                      sizes="(max-width: 640px) 80px, 96px"
                      className="object-contain p-1 transition-transform duration-500 ease-out group-hover:scale-102 mix-blend-multiply"
                      unoptimized={portfolio.image.includes('token=') || portfolio.image.includes('supabase')}
                    />
                  </div>
                  </>
                ) : (
                  <Brush 
                    className="w-6 h-6 text-gray-400 group-hover:text-gray-700 transition-colors" 
                    strokeWidth={1.2} 
                  />
                )}
              </div>
              <span className="text-[14px] sm:text-[15px] font-normal text-gray-500 text-center line-clamp-1 truncate group-hover:text-gray-950 transition-colors capitalize">
                {portfolio.name.toLowerCase()}
              </span>
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 z-20 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 cursor-pointer shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 pl-0.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
    </>
  )
}