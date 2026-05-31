// src/app/(shop)/products/ProductsClientView.tsx

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchX } from 'lucide-react'
import FilterSidebar from '@/components/product/FilterSidebar'
import FilterDrawer from '@/components/product/FilterDrawer'
import ProductsGrid from '@/components/product/ProductsGrid'

export interface Product {
  id: string
  min_order_qty: number
  name: string
  slug: string
  description?: string | null
  category_id?: string | null
  price: number
  selling_price?: number | null
  images: string[]
  stock: number
  rating: number
  pricing_tiers?: any[] // The God Mode Tiers
}

interface ProductsClientViewProps {
  initialProducts: Product[]
  categories: any[]
}

// 🚨 2. HELPER FUNCTIONS FOR DYNAMIC PRICING MATH
const getBasePrice = (p: Product) => {
  if (p.pricing_tiers && p.pricing_tiers.length > 0) return p.pricing_tiers[0].mrp;
  return p.price; // Legacy fallback
}

const getSellingPrice = (p: Product) => {
  if (p.pricing_tiers && p.pricing_tiers.length > 0) return p.pricing_tiers[0].selling_price;
  return p.selling_price || p.price; // Legacy fallback
}

const hasBulkTier = (p: Product) => {
  // 🚨 FIX: Strict logic checking dynamic tiers ONLY
  if (p.pricing_tiers && p.pricing_tiers.length > 1) {
    return p.pricing_tiers.some(t => t.min_quantity >= 10 || t.tier_name.toLowerCase().includes('wholesale'))
  }
  return false
}

export default function ProductsClientView({ initialProducts, categories }: ProductsClientViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const categoryId = searchParams.get('category') || ''
  const search = searchParams.get('q') || searchParams.get('search') || ''
  const minPrice = searchParams.get('min') || ''
  const maxPrice = searchParams.get('max') || ''
  const sort = searchParams.get('sort') || 'newest'
  const rating = searchParams.get('rating') || ''
  const discount = searchParams.get('discount') || ''
  const bulk = searchParams.get('bulk') || ''
  const inStock = searchParams.get('inStock') || ''

  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    setVisibleCount(10)
  }, [categoryId, search, minPrice, maxPrice, sort, rating, discount, bulk, inStock])

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const clearFilters = () => {
    if (pathname === '/search') {
      router.replace('/products', { scroll: false })
    } else {
      router.replace(pathname, { scroll: false })
    }
  }

  // 🚨 3. THE UPGRADED FILTER ENGINE
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    if (categoryId && categoryId !== 'all') {
      const targetCategory = categories.find(c => c.id === categoryId || c.slug === categoryId)
      const actualId = targetCategory ? targetCategory.id : categoryId
      result = result.filter(p => p.category_id === actualId)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q)
      )
    }

    // Price Filtering using Dynamic Tiers
    if (minPrice) result = result.filter(p => getSellingPrice(p) >= parseFloat(minPrice))
    if (maxPrice) result = result.filter(p => getSellingPrice(p) <= parseFloat(maxPrice))

    if (rating) {
      result = result.filter(p => (p.rating ?? 4.5) >= parseFloat(rating))
    }

    // Discount Math using Dynamic Tiers
    if (discount) {
      result = result.filter(p => {
        const rp = getBasePrice(p)
        const sp = getSellingPrice(p)
        if (rp <= sp) return false
        const pct = Math.round(((rp - sp) / rp) * 100)
        return pct >= parseInt(discount, 10)
      })
    }

    // Bulk Filtering using Dynamic Tiers
    if (bulk === 'true') {
      result = result.filter(p => hasBulkTier(p))
    }

    if (inStock === 'true') {
      result = result.filter(p => p.stock > 0)
    }

    // Sorting using Dynamic Tiers
    switch (sort) {
      case 'price_asc': result.sort((a, b) => getSellingPrice(a) - getSellingPrice(b)); break;
      case 'price_desc': result.sort((a, b) => getSellingPrice(b) - getSellingPrice(a)); break;
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': default: break;
    }

    return result
  }, [initialProducts, categories, categoryId, search, minPrice, maxPrice, sort, rating, discount, bulk, inStock])

  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: initialProducts.filter(p => p.category_id === cat.id).length
  }))

  const filterProps = {
    categories: categoriesWithCounts,
    currentCategory: categoryId,
    currentSort: sort,
    minPrice,
    maxPrice,
    rating,
    discount,
    bulk,
    inStock,
    updateFilters,
    clearFilters
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 lg:gap-6 relative items-start" suppressHydrationWarning>
      <div className="w-full md:hidden flex gap-2" suppressHydrationWarning>
        <button onClick={() => setIsMobileFilterOpen(true)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-sm text-sm font-bold text-gray-900 shadow-sm flex items-center justify-center gap-2">Filters</button>
        <div className="flex-1 relative" suppressHydrationWarning>
           <select value={sort} title="Sort products" onChange={(e) => updateFilters({ sort: e.target.value })} className="w-full py-2.5 pl-3 pr-8 bg-white border border-gray-300 rounded-sm text-sm font-bold text-gray-900 shadow-sm appearance-none focus:outline-none">
             <option value="newest">Featured</option>
             <option value="price_asc">Price: Low to High</option>
             <option value="price_desc">Price: High to Low</option>
             <option value="name_asc">Alphabetical</option>
           </select>
        </div>
      </div>

      <div className="hidden md:block w-[240px] shrink-0 sticky top-20 bg-white border border-gray-200 rounded-sm p-4 shadow-sm" suppressHydrationWarning>
        <FilterSidebar {...filterProps} />
      </div>

      <FilterDrawer isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)} {...filterProps} />

      <div className="flex-1 w-full flex flex-col gap-4" suppressHydrationWarning>
        <div className="hidden md:flex justify-between items-center bg-white p-3 border border-gray-200 shadow-sm rounded-sm" suppressHydrationWarning>
          <span className="text-sm text-gray-700">
            Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> results
            {search && <span> for <span className="text-[#C7511F] font-bold">&quot;{search}&quot;</span></span>}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col items-center">
            <SearchX className="w-16 h-16 text-gray-200 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-gray-900">
              {search ? `No results found.` : 'No results found.'}
            </h3>
            {search && <p className="text-sm text-gray-600 mt-2">Try checking your spelling or using more general terms.</p>}
            <button onClick={clearFilters} className="mt-4 text-sm text-[#007185] font-medium hover:text-[#C7511F] hover:underline cursor-pointer">
              {pathname === '/search' ? 'Clear search and view all products' : 'Clear all filters'}
            </button>
          </div>
        ) : (
              <>
                <ProductsGrid products={filteredProducts.slice(0, visibleCount)} />
                {visibleCount < filteredProducts.length && (
                  <div className="mt-8 flex justify-center pb-8">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      className="px-8 py-2.5 bg-white hover:bg-gray-50 border border-[#D5D9D9] rounded-full text-sm font-bold text-[#0F1111] shadow-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007185]"
                    >
                      Load more products
                    </button>
                  </div>
                )}
              </>
        )}
      </div>
    </div>
  )
}