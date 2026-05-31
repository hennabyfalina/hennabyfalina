// src/components/product/FilterDrawer.tsx

'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
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
    <div className="z-[99999] flex flex-col justify-end bg-black/60 backdrop-blur-sm md:hidden animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" style={{ touchAction: 'none' }} />
      <div className="relative bg-white rounded-t-md p-5 animate-slide-up pb-safe shadow-2xl flex flex-col max-h-[85dvh] z-10">
        <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-3 shrink-0">
          <h2 className="font-bold text-xl text-gray-900">Filters</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-sm transition-colors cursor-pointer" aria-label="Close menu">✕</button>
        </div>
        
        <div className="overflow-y-auto overscroll-contain no-scrollbar flex-1 min-h-0 pb-4">
          <FilterSidebar 
            {...filterProps} 
            updateFilters={(updates) => {
              filterProps.updateFilters(updates);
            }}
          />
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full text-sm font-bold text-[#0F1111] transition-colors shadow-sm cursor-pointer"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}