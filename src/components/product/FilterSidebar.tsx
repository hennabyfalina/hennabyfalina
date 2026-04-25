// src/components/product/FilterSidebar.tsx

'use client'

interface FilterSidebarProps {
  categories: any[]
  currentCategory: string
  currentSort: string
  minPrice: string
  maxPrice: string
  updateFilters: (updates: Record<string, string | null>) => void
  clearFilters: () => void
}

export default function FilterSidebar({
  categories, currentCategory, minPrice, maxPrice, updateFilters, clearFilters
}: FilterSidebarProps) {
  
  const hasActiveFilters = currentCategory || minPrice || maxPrice

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-900">Category</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
          {/* "All Categories" Option */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox"
              checked={!currentCategory || currentCategory === 'all'}
              onChange={() => updateFilters({ category: null })}
              className="w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600]"
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
                  onChange={() => updateFilters({ category: cat.slug })} // We use slug for cleaner URLs
                  className="w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600]"
                />
                <span className={`text-sm flex-1 ${isActive ? 'text-gray-900 font-bold' : 'text-gray-700 hover:text-[#e77600]'}`}>
                  {cat.name} <span className="text-gray-500 font-normal">({cat.count})</span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilters({ min: e.target.value || null })}
            className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600]"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilters({ max: e.target.value || null })}
            className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600]"
          />
        </div>
      </div>
    </div>
  )
}