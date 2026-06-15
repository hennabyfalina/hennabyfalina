// src/components/product/FilterDrawer.tsx

'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import FilterSidebar from './FilterSidebar'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  categories: any[]
  currentCategory: string
  currentSort: string
  minPrice: string
  maxPrice: string
  rating?: string
  discount?: string
  wholesale?: string
  inStock?: string
  updateFilters: (updates: Record<string, string | null>) => void
  clearFilters: () => void
}

export default function FilterDrawer({ isOpen, onClose, ...filterProps }: FilterDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div 
      className="z-[100000] flex flex-col justify-end bg-black/10 backdrop-blur-xs md:hidden animate-fade-in" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}
    >
      {/* Outside Click Close Mask */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" style={{ touchAction: 'none' }} />
      
      {/* Polished Bottom Sheet Slider Menu Tray, Soft Curves, No Hard Shadows */}
      <div className="relative bg-white rounded-t-[20px] p-5 animate-slide-up pb-safe shadow-2xl flex flex-col max-h-[82dvh] z-10 border-t border-stone-100 w-full">
        
        {/* Aesthetic Centered Drag Indicator Handle Line */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4 shrink-0" />
        
        {/* Drawer Header Layout */}
        <div className="flex justify-between items-center mb-3 border-b border-stone-50 pb-2 shrink-0">
          <h2 className="font-semibold text-[12px] text-gray-900 tracking-wider uppercase">Filters</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-950 rounded-full hover:bg-stone-50 transition-colors cursor-pointer outline-none" 
            aria-label="Close menu"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        
        {/* Content Scroll Shell Area */}
        <div className="overflow-y-auto overscroll-contain no-scrollbar flex-1 min-h-0 pb-16">
          <FilterSidebar 
            {...filterProps} 
            updateFilters={(updates) => {
              filterProps.updateFilters(updates);
            }}
          />
        </div>
        
        {/* Sticky Action Footer Call to Action */}
        <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-stone-100 z-30 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="w-full h-10 bg-black hover:bg-stone-900 text-white rounded-full text-[12px] font-semibold tracking-wide uppercase transition-all shadow-none active:scale-[0.99] cursor-pointer outline-none"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}