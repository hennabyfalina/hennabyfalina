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

  // State controllers for section toggles
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(true)
  const [isOffersOpen, setIsOffersOpen] = useState(true)

  return (
    <div className="flex flex-col w-full font-sans select-none text-left" suppressHydrationWarning>
      
      {/* Active Filter Clearance Header */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Active Filters</span>
          <button 
            onClick={clearFilters} 
            className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer outline-none border-none bg-transparent"
          >
            Clear all
          </button>
        </div>
      )}

      {/* SECTION 1: PRODUCT CATEGORIES */}
      <div className="py-3.5 border-b border-stone-100">
        <button
          type="button"
          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Product categories</span>
          {isCategoriesOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          )}
        </button>

        {isCategoriesOpen && (
          <div className="mt-4 flex flex-col gap-3 animate-fade-in">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={!currentCategory || currentCategory === 'all'}
                onChange={() => updateFilters({ category: null })}
                className="w-4 h-4 text-gray-900 border-stone-300 focus:ring-black accent-black cursor-pointer"
              />
              <span className={`text-[13px] tracking-tight transition-colors ${!currentCategory || currentCategory === 'all' ? 'font-bold text-gray-950' : 'text-gray-600 group-hover:text-gray-950'}`}>
                All Collections
              </span>
            </label>

            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {categories.map((category) => {
                const isSelected = currentCategory === category.id || currentCategory === category.slug
                return (
                  <label key={category.id} className="flex items-center gap-3 cursor-pointer group w-full justify-between pr-0.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="radio"
                        name="category"
                        checked={isSelected}
                        onChange={() => updateFilters({ category: category.slug || category.id })}
                        className="w-4 h-4 text-gray-900 border-stone-300 focus:ring-black accent-black cursor-pointer shrink-0"
                      />
                      <span className={`text-[13px] tracking-tight truncate transition-colors ${isSelected ? 'font-bold text-blue-600' : 'text-gray-600 group-hover:text-gray-950'}`}>
                        {category.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 shrink-0">({category.count})</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: AVAILABILITY */}
      <div className="py-3.5 border-b border-stone-100">
        <button
          type="button"
          onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Availability</span>
          {isAvailabilityOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          )}
        </button>

        {isAvailabilityOpen && (
          <div className="mt-4 flex flex-col gap-3 animate-fade-in">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeInStock === 'true'}
                onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : null })}
                className="w-4 h-4 rounded text-gray-900 border-stone-300 focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-950 transition-colors">In Stock</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeWholesale === 'true'}
                onChange={(e) => updateFilters({ wholesale: e.target.checked ? 'true' : null })}
                className="w-4 h-4 rounded text-gray-900 border-stone-300 focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-950 transition-colors">Wholesale Configs</span>
            </label>
          </div>
        )}
      </div>

      {/* SECTION 3: PRICE RANGE */}
      <div className="py-3.5 border-b border-stone-100">
        <button
          type="button"
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Price Range</span>
          {isPriceOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
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

      {/* SECTION 4: OFFERS & DISCOUNTS */}
      <div className="py-3.5 mb-1">
        <button
          type="button"
          onClick={() => setIsOffersOpen(!isOffersOpen)}
          className="w-full flex items-center justify-between text-left group focus:outline-none cursor-pointer py-1"
        >
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Offers & Discounts</span>
          {isOffersOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
          )}
        </button>

        {isOffersOpen && (
          <div className="mt-4 flex flex-col gap-3 animate-fade-in">
            {[10, 25, 50, 70].map((pct) => {
              const isSelected = activeDiscount === pct.toString()
              return (
                <label key={pct} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="discount"
                    checked={isSelected}
                    onChange={() => updateFilters({ discount: pct.toString() })}
                    className="w-4 h-4 text-gray-900 border-stone-300 focus:ring-black accent-black cursor-pointer"
                  />
                  <span className={`text-[13px] tracking-tight transition-colors ${isSelected ? 'font-bold text-gray-950' : 'text-gray-600 group-hover:text-gray-950'}`}>
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