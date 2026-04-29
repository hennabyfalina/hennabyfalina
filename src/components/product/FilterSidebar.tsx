// src/components/product/FilterSidebar.tsx

'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface FilterSidebarProps {
  categories: any[]
  currentCategory: string
  currentSort: string
  minPrice: string
  maxPrice: string
  rating?: string
  discount?: string
  bulk?: string
  inStock?: string
  updateFilters: (updates: Record<string, string | null>) => void
  clearFilters: () => void
}

export default function FilterSidebar({
  categories, currentCategory, minPrice, maxPrice, rating, discount, bulk, inStock, updateFilters, clearFilters
}: FilterSidebarProps) {
  
  const searchParams = useSearchParams()
  const activeRating = rating || (searchParams ? searchParams.get('rating') : '') || ''
  const activeDiscount = discount || (searchParams ? searchParams.get('discount') : '') || ''
  const activeBulk = bulk || (searchParams ? searchParams.get('bulk') : '') || ''
  const activeInStock = inStock || (searchParams ? searchParams.get('inStock') : '') || ''

  const hasActiveFilters = currentCategory || minPrice || maxPrice || activeRating || activeDiscount || activeBulk || activeInStock

  // Local state for custom price fields to prevent keystroke lag
  const [localMin, setLocalMin] = useState(minPrice || '')
  const [localMax, setLocalMax] = useState(maxPrice || '')

  useEffect(() => {
    setLocalMin(minPrice || '')
    setLocalMax(maxPrice || '')
  }, [minPrice, maxPrice])

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ min: localMin || null, max: localMax || null })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-900">Category</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox"
              checked={!currentCategory || currentCategory === 'all'}
              onChange={() => updateFilters({ category: 'all' })}
              className="w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600] cursor-pointer"
            />
            <span className={`text-sm ${(!currentCategory || currentCategory === 'all') ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
              All Categories
            </span>
          </label>

          {categories.map((cat) => {
            // FIX: Check if active by ID OR Slug
            const isActive = currentCategory === cat.id || currentCategory === cat.slug;
            
            return (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={isActive}
                  onChange={() => updateFilters({ category: isActive ? 'all' : cat.slug })}
                  className="w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600] cursor-pointer"
                />
                <span className={`text-sm flex-1 ${isActive ? 'text-gray-900 font-bold' : 'text-gray-900 group-hover:text-[#e77600]'}`}>
                  {cat.name} <span className="text-gray-500 font-normal">({cat.count})</span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer group mb-1">
          <input
            type="checkbox"
            checked={activeInStock === 'true'}
            onChange={() => updateFilters({ inStock: activeInStock === 'true' ? null : 'true' })}
            className="w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600] cursor-pointer"
          />
          <span className={`text-sm ${activeInStock === 'true' ? 'text-gray-900 font-bold' : 'text-gray-900 group-hover:text-[#e77600]'}`}>
            Exclude Out of Stock
          </span>
        </label>
      </div>

      {/* Customer Reviews Filter */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Customer Reviews</h3>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => updateFilters({ rating: activeRating === stars.toString() ? null : stars.toString() })}
              className="flex items-center gap-1.5 group w-full text-left focus:outline-none cursor-pointer"
            >
              <div className="flex text-[#FFA41C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < stars ? 'fill-current' : 'text-gray-300'} ${activeRating === stars.toString() ? 'drop-shadow-sm' : ''}`} />
                ))}
              </div>
              <span className={`text-sm ${activeRating === stars.toString() ? 'text-[#e77600] font-bold' : 'text-gray-900 group-hover:text-[#e77600]'}`}>{stars === 5 ? '5.0' : `${stars}.0 above`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter with Lag Fix */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Price</h3>
        <div className="space-y-2 mb-3">
          {[
            { label: 'Under ₹500', min: null, max: '500' },
            { label: '₹500 - ₹1,000', min: '500', max: '1000' },
            { label: '₹1,000 - ₹5,000', min: '1000', max: '5000' },
            { label: 'Over ₹5,000', min: '5000', max: null },
          ].map((range, idx) => {
            const isActive = minPrice === (range.min || '') && maxPrice === (range.max || '');
            return (
              <button
                key={idx}
                onClick={() => {
                  setLocalMin(range.min || '')
                  setLocalMax(range.max || '')
                  updateFilters({ min: range.min, max: range.max })
                }}
                className={`block text-sm text-left w-full focus:outline-none cursor-pointer ${isActive ? 'text-[#e77600] font-bold' : 'text-gray-900 hover:text-[#e77600]'}`}
              >
                {range.label}
              </button>
            )
          })}
        </div>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-sm px-2 focus-within:border-[#e77600] focus-within:ring-1 focus-within:ring-[#e77600] shadow-sm flex-1">
            <span className="text-gray-500 text-sm">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full py-1.5 text-sm focus:outline-none bg-transparent"
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-sm px-2 focus-within:border-[#e77600] focus-within:ring-1 focus-within:ring-[#e77600] shadow-sm flex-1">
            <span className="text-gray-500 text-sm">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full py-1.5 text-sm focus:outline-none bg-transparent"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-white border border-gray-300 rounded-sm text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#e77600] cursor-pointer">
            Go
          </button>
        </form>
      </div>

      {/* Deals & Discounts Filter */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Deals & Discounts</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group mb-1">
            <input
              type="checkbox"
              checked={activeBulk === 'true'}
              onChange={() => updateFilters({ bulk: activeBulk === 'true' ? null : 'true' })}
              className="w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600] cursor-pointer"
            />
            <span className={`text-sm ${activeBulk === 'true' ? 'text-gray-900 font-bold' : 'text-gray-900 group-hover:text-[#e77600]'}`}>
              Bulk Discount Available
            </span>
          </label>
          {[10, 25, 50].map((pct) => (
            <button
              key={pct}
              onClick={() => updateFilters({ discount: activeDiscount === pct.toString() ? null : pct.toString() })}
              className={`block text-sm text-left w-full focus:outline-none cursor-pointer ${activeDiscount === pct.toString() ? 'text-[#e77600] font-bold' : 'text-gray-900 hover:text-[#e77600]'}`}
            >
              {pct}% Off or more
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}