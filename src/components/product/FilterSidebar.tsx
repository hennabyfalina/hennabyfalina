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
  wholesale?: string
  inStock?: string
  updateFilters: (updates: Record<string, string | null>) => void
  clearFilters: () => void
}

export default function FilterSidebar({
  categories, currentCategory, minPrice, maxPrice, rating, discount, wholesale, inStock, updateFilters, clearFilters
}: FilterSidebarProps) {
  
  const searchParams = useSearchParams()
  const activeRating = rating || (searchParams ? searchParams.get('rating') : '') || ''
  const activeDiscount = discount || (searchParams ? searchParams.get('discount') : '') || ''
  const activeWholesale = wholesale || (searchParams ? searchParams.get('wholesale') : '') || '' // 🚨 FIX
  const activeInStock = inStock || (searchParams ? searchParams.get('inStock') : '') || ''

  const hasActiveFilters = currentCategory || minPrice || maxPrice || activeRating || activeDiscount || activeWholesale || activeInStock

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
    <div className="flex flex-col gap-6" suppressHydrationWarning>
      
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-bold text-gray-900">Filters Applied</span>
          <button onClick={clearFilters} className="text-xs font-medium text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
            Clear All
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Category</h3>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar pr-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={!currentCategory || currentCategory === 'all'}
              onChange={() => updateFilters({ category: null })}
              className="w-4 h-4 text-[#007185] border-gray-300 focus:ring-[#007185] cursor-pointer"
            />
            <span className={`text-sm ${!currentCategory || currentCategory === 'all' ? 'font-bold text-[#007185]' : 'text-gray-600 group-hover:text-gray-900'}`}>
              All Categories
            </span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={currentCategory === category.id || currentCategory === category.slug}
                onChange={() => updateFilters({ category: category.slug || category.id })}
                className="w-4 h-4 text-[#007185] border-gray-300 focus:ring-[#007185] cursor-pointer"
              />
              <span className={`text-sm flex-1 ${currentCategory === category.id || currentCategory === category.slug ? 'font-bold text-[#007185]' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {category.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-sm">{category.count}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Price */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Price</h3>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-sm px-2 focus-within:border-[#007185] focus-within:ring-1 focus-within:ring-[#007185] shadow-sm flex-1" suppressHydrationWarning>
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
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-sm px-2 focus-within:border-[#007185] focus-within:ring-1 focus-within:ring-[#007185] shadow-sm flex-1" suppressHydrationWarning>
            <span className="text-gray-500 text-sm">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full py-1.5 text-sm focus:outline-none bg-transparent"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-white border border-gray-300 rounded-sm text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
            Go
          </button>
        </form>
      </div>

      <hr className="border-gray-200" />

      {/* Availability */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Availability</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={activeInStock === 'true'}
              onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : null })}
              className="w-4 h-4 text-[#007185] border-gray-300 rounded-sm focus:ring-[#007185] cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">Include Out of Stock</span>
          </label>
          {/* 🚨 FIX: Wholesale URL param strictly enforced */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={activeWholesale === 'true'}
              onChange={(e) => updateFilters({ wholesale: e.target.checked ? 'true' : null })}
              className="w-4 h-4 text-[#007185] border-gray-300 rounded-sm focus:ring-[#007185] cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium">Wholesale Options</span>
          </label>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Discount */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Discount</h3>
        <div className="flex flex-col gap-2">
          {[10, 25, 50, 70].map((pct) => (
            <label key={pct} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="discount"
                checked={activeDiscount === pct.toString()}
                onChange={() => updateFilters({ discount: pct.toString() })}
                className="w-4 h-4 text-[#007185] border-gray-300 focus:ring-[#007185] cursor-pointer"
              />
              <span className={`text-sm ${activeDiscount === pct.toString() ? 'font-bold text-[#007185]' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {pct}% Off or more
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Customer Reviews */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Customer Reviews</h3>
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 1].map((stars) => (
            <label key={stars} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-1 -ml-1 rounded transition-colors">
              <input
                type="radio"
                name="rating"
                checked={activeRating === stars.toString()}
                onChange={() => updateFilters({ rating: stars.toString() })}
                className="w-4 h-4 text-[#007185] border-gray-300 focus:ring-[#007185] cursor-pointer mt-0.5 shrink-0"
              />
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#FFA41C] text-[#FFA41C]" />
                <span className={`text-sm ${activeRating === stars.toString() ? 'font-bold text-[#007185]' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {stars}.0 Above
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

    </div>
  )
}