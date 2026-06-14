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
      className="z-[100000] flex flex-col justify-end bg-black/20 backdrop-blur-xs md:hidden animate-fade-in" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}
    >
      {/* Outside Click Close Mask */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" style={{ touchAction: 'none' }} />
      
      {/* 🚀 FIXED: Polished Bottom Sheet Slider Menu Tray, Soft Curves, No Hard Shadows */}
      <div className="relative bg-white rounded-t-[24px] p-6 animate-slide-up pb-safe shadow-2xl flex flex-col max-h-[85dvh] z-10 border-t border-gray-100 w-full">
        
        {/* Aesthetic Centered Drag Indicator Handle Line */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
        
        {/* Drawer Header Layout */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3 shrink-0">
          <h2 className="font-bold text-[14px] text-gray-900 tracking-wider capitalize">Filters Workspace</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100" 
            aria-label="Close menu"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Content Scroll Shell Area */}
        <div className="overflow-y-auto overscroll-contain no-scrollbar flex-1 min-h-0 pb-20">
          <FilterSidebar 
            {...filterProps} 
            updateFilters={(updates) => {
              filterProps.updateFilters(updates);
            }}
          />
        </div>
        
        {/* Sticky Action Footer Call to Action (Locked to base of the sheet view) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-30 shrink-0">
          <button 
            onClick={onClose}
            className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-[12px] font-bold tracking-widest transition-all shadow-md active:scale-[0.99] uppercase cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}