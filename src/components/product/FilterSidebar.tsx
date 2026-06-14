// src/components/product/FilterSidebar.tsx

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PriceRangeInputs from '@/components/ui/PriceRangeInputs'

interface FilterSidebarProps {
  categories: any[]
  currentCategory: string
  currentSort: string
  minPrice: string
  maxPrice: string
  wholesale?: string
  inStock?: string
  discount?: string
  updateFilters: (updates: Record<string, string | null>) => void
  clearFilters: () => void
}

export default function FilterSidebar({
  categories,
  currentCategory,
  minPrice,
  maxPrice,
  wholesale,
  inStock,
  discount,
  updateFilters,
  clearFilters
}: FilterSidebarProps) {
  
  const activeDiscount = discount || ''
  const activeWholesale = wholesale || ''
  const activeInStock = inStock || ''

  const hasActiveFilters = currentCategory || minPrice || maxPrice || activeDiscount || activeWholesale || activeInStock

  // 🎯 GOOGLE METHOD ACCOMODATION: State switches to smoothly toggle sections open/close
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false) // Closed by default as shown in layout specs
  const [isPriceOpen, setIsPriceOpen] = useState(true)
  const [isOffersOpen, setIsOffersOpen] = useState(true)

  return (
    <div className="flex flex-col w-full font-sans select-none" suppressHydrationWarning>
      
      {/* Active Filter Clearances Header Option */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-4">
          <span className="text-[14px] font-medium text-gray-500">Active Filters</span>
          <button 
            onClick={clearFilters} 
            className="text-[15px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ====================================================================
          SECTION 1: PRODUCT CATEGORIES (COLLECTIONS)
         ==================================================================== */}
      <div className="py-4 border-b border-gray-100">
        <button
          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[18px] sm:text-[20px] font-normal text-gray-950 tracking-tight">Product categories</span>
          {isCategoriesOpen ? (
            <ChevronUp className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {isCategoriesOpen && (
          <div className="mt-5 flex flex-col gap-4 animate-fade-in">
            {/* All Collections Anchor Row */}
            <label className="flex items-center gap-3.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={!currentCategory || currentCategory === 'all'}
                onChange={() => updateFilters({ category: null })}
                className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900 accent-gray-900 cursor-pointer"
              />
              <span className={`text-[15px] sm:text-[16px] tracking-normal transition-colors ${!currentCategory || currentCategory === 'all' ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                All Collections
              </span>
            </label>

            {/* 🌟 SWIPE/LINE OPTION: Scroll Container for extended category lengths */}
            <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {categories.map((category) => {
                const isSelected = currentCategory === category.id || currentCategory === category.slug
                return (
                  <label key={category.id} className="flex items-center gap-3.5 cursor-pointer group w-full justify-between pr-1">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="radio"
                        name="category"
                        checked={isSelected}
                        onChange={() => updateFilters({ category: category.slug || category.id })}
                        className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900 accent-gray-900 cursor-pointer shrink-0"
                      />
                      <span className={`text-[15px] sm:text-[16px] tracking-normal truncate transition-colors ${isSelected ? 'font-bold text-blue-600' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        {category.name}
                      </span>
                    </div>
                    <span className="text-[13px] text-gray-400 font-medium shrink-0">({category.count})</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 2: AVAILABILITY
         ==================================================================== */}
      <div className="py-4 border-b border-gray-100">
        <button
          onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[18px] sm:text-[20px] font-normal text-gray-950 tracking-tight">Availability</span>
          {isAvailabilityOpen ? (
            <ChevronUp className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {isAvailabilityOpen && (
          <div className="mt-5 flex flex-col gap-4 animate-fade-in">
            <label className="flex items-center gap-3.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeInStock === 'true'}
                onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : null })}
                className="w-5 h-5 rounded text-gray-900 border-gray-300 focus:ring-gray-900 accent-gray-900 cursor-pointer"
              />
              <span className="text-[15px] sm:text-[16px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">In Stock</span>
            </label>
            <label className="flex items-center gap-3.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeWholesale === 'true'}
                onChange={(e) => updateFilters({ wholesale: e.target.checked ? 'true' : null })}
                className="w-5 h-5 rounded text-gray-900 border-gray-300 focus:ring-gray-900 accent-gray-900 cursor-pointer"
              />
              <span className="text-[15px] sm:text-[16px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Wholesale Configs</span>
            </label>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 3: PRICE RANGE
         ==================================================================== */}
      <div className="py-4 border-b border-gray-100">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[18px] sm:text-[20px] font-normal text-gray-950 tracking-tight">Price Range</span>
          {isPriceOpen ? (
            <ChevronUp className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {isPriceOpen && (
          <div className="mt-2 animate-fade-in">
            <PriceRangeInputs 
              initialMin={minPrice} 
              initialMax={maxPrice} 
              onChange={(min, max) => updateFilters({ min, max })} 
            />
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 4: OFFERS & DISCOUNTS
         ==================================================================== */}
      <div className="py-4 mb-2">
        <button
          onClick={() => setIsOffersOpen(!isOffersOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[18px] sm:text-[20px] font-normal text-gray-950 tracking-tight">Offers & Discounts</span>
          {isOffersOpen ? (
            <ChevronUp className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {isOffersOpen && (
          <div className="mt-5 flex flex-col gap-4 animate-fade-in">
            {[10, 25, 50, 70].map((pct) => {
              const isSelected = activeDiscount === pct.toString()
              return (
                <label key={pct} className="flex items-center gap-3.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="discount"
                    checked={isSelected}
                    onChange={() => updateFilters({ discount: pct.toString() })}
                    className="w-5 h-5 text-gray-900 border-gray-300 focus:ring-gray-900 accent-gray-900 cursor-pointer"
                  />
                  <span className={`text-[15px] sm:text-[16px] tracking-normal transition-colors ${isSelected ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {pct}% Off or More
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}