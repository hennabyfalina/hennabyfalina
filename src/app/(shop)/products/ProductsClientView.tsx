// src/app/(shop)/products/ProductsClientView.tsx

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SearchX, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react'
import FilterSidebar from '@/components/product/FilterSidebar'
import ProductCard from '@/components/product/ProductCard'
import SortDropdown from '@/components/ui/SortDropdown'
import ProductPageHeader from '@/components/product/ProductPageHeader'
import { getComputedProductPrices } from '@/lib/pricing'
import type { Product } from '@/types/database.types'

interface ProductsClientViewProps {
  initialProducts: Product[]
  categories: any[]
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' }
]

export default function ProductsClientView({ initialProducts, categories }: ProductsClientViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(12)

  const categoryId = searchParams.get('category') || ''
  const search = searchParams.get('q') || searchParams.get('search') || ''
  const minPrice = searchParams.get('min') || ''
  const maxPrice = searchParams.get('max') || ''
  const sort = searchParams.get('sort') || 'newest'
  const discount = searchParams.get('discount') || ''
  const wholesale = searchParams.get('wholesale') || ''
  const inStock = searchParams.get('inStock') || ''

  const isBrowsingAllCollections = !categoryId

  useEffect(() => {
    setVisibleCount(12)
  }, [categoryId, search, minPrice, maxPrice, sort, discount, wholesale, inStock])

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const clearFilters = () => {
    router.replace('/products', { scroll: false })
  }

  const activeCategory = useMemo(() => {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId || c.slug === categoryId) || null
  }, [categoryId, categories])

  const filteredProducts = useMemo(() => {
    let processed = initialProducts.map(p => {
      const metrics = getComputedProductPrices(p as any, null)
      return {
        ...p,
        _computedPrice: metrics.displayPrice,
        _computedDiscount: metrics.discountPct,
        _isWholesaleAvailable: metrics.isWholesaleAvailable
      }
    })

    if (activeCategory) {
      processed = processed.filter(p => p.category_id === activeCategory.id)
    }

    if (search) {
      const q = search.toLowerCase()
      processed = processed.filter(p => 
        p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      )
    }

    if (minPrice) processed = processed.filter(p => p._computedPrice >= parseFloat(minPrice))
    if (maxPrice) processed = processed.filter(p => p._computedPrice <= parseFloat(maxPrice))
    if (discount) processed = processed.filter(p => p._computedDiscount >= parseInt(discount, 10))
    if (wholesale === 'true') processed = processed.filter(p => p._isWholesaleAvailable)
    if (inStock === 'true') processed = processed.filter(p => p.stock > 0)

    switch (sort) {
      case 'price_asc': processed.sort((a, b) => a._computedPrice - b._computedPrice); break;
      case 'price_desc': processed.sort((a, b) => b._computedPrice - a._computedPrice); break;
      case 'name_asc': processed.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return processed
  }, [initialProducts, activeCategory, search, minPrice, maxPrice, sort, discount, wholesale, inStock])

  const shopCategories = useMemo(() => {
    return categories
      .filter(cat => cat.type !== 'portfolio')
      .map(cat => ({
        ...cat,
        count: initialProducts.filter(p => p.category_id === cat.id).length
      }))
  }, [categories, initialProducts])

  const filterProps = {
    categories: shopCategories,
    currentCategory: categoryId,
    currentSort: sort,
    minPrice,
    maxPrice,
    wholesale,
    inStock,
    discount,
    updateFilters,
    clearFilters
  }

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Featured'

  // ====================================================================
  // VIEW RENDER A: REPOSITORY DIRECTORY LISTING MODE (ALL COLLECTIONS)
  // ====================================================================
  if (isBrowsingAllCollections) {
    return (
      <div className="w-full flex flex-col gap-10 py-6 md:py-12 animate-fade-in font-sans selection:bg-gray-900 selection:text-white">
        <div className="pb-2 pt-4 md:pt-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-normal text-gray-950 tracking-tight capitalize">
            Our Products
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-medium mt-1.5">
            Select a specialized category shelf below to view premium essentials
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-[1400px] mx-auto w-full px-2">
          {shopCategories.map((category) => {
            const itemCount = category.count
            const categoryImage = category.image || '/placeholder-category.svg'
            
            return (
              <Link 
                key={category.id}
                href={`/products?category=${category.slug || category.id}`}
                className="group relative flex flex-col bg-white overflow-hidden rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 shadow-xs"
              >
                <div className="relative aspect-[4/5] bg-stone-50/20 overflow-hidden w-full flex items-center justify-center">
                  <Image 
                    src={categoryImage}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    unoptimized={categoryImage.startsWith('http')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-90 transition-opacity" />
                  
                  <div className="absolute bottom-6 left-0 right-0 px-4 text-center flex flex-col items-center">
                    <h2 className="text-xl sm:text-2xl font-medium text-white tracking-wide capitalize">
                      {category.name}
                    </h2>
                    <span className="text-xs sm:text-sm font-medium tracking-wider text-white/90 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full mt-3 border border-white/10 lowercase">
                      {itemCount} items
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // ====================================================================
  // VIEW RENDER B: FILTERABLE GRID SYSTEM MODE (SELECTED CATEGORIES)
  // ====================================================================
  const activeCategoryName = (activeCategory?.name || 'Collection')

  return (
    <>
      <ProductPageHeader />

      <div className="w-full flex flex-col gap-6 pt-14 md:pt-2 relative animate-fade-in font-sans selection:bg-gray-900 selection:text-white">
        
        {/* Centered Modern Title Track & Minimal Breadcrumb Shell */}
        <div className="w-full relative pt-8 pb-4 flex flex-col items-center justify-center text-center gap-2">
          <nav className="hidden md:flex items-center gap-2.5 text-[14px] font-medium text-gray-400 tracking-wide">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-200">/</span>
            <Link href="/products" className="hover:text-gray-900 transition-colors">Products</Link>
            <span className="text-gray-200">/</span>
            <span className="text-gray-900 capitalize font-semibold">{activeCategoryName}</span>
          </nav>
          
          <h1 className="text-3xl sm:text-5xl font-normal text-gray-950 tracking-tight capitalize leading-tight">
            {activeCategoryName}
          </h1>
        </div>

        {/* Action Strip: Single row border line alignment, zero shadows */}
        <div className="w-full flex items-center justify-between bg-white py-3 px-1 transition-all">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="h-10 px-4 border border-gray-200 rounded-full text-[12px] font-medium text-gray-700 flex items-center gap-2 bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all cursor-pointer shadow-none"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.8} />
            <span>Filter</span>
          </button>

          <div className="flex items-center">
            <div className="hidden md:block">
              <SortDropdown value={sort} onChange={(val) => updateFilters({ sort: val })} />
            </div>
            
            <button
              onClick={() => setIsSortDrawerOpen(true)}
              className="md:hidden h-10 px-4 border border-gray-200 rounded-full text-[12px] font-medium text-gray-700 flex items-center gap-1 bg-white active:scale-[0.98] transition-all shadow-none cursor-pointer"
            >
              <span>{activeSortLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Filter Drawer - Mobile Bottom / Desktop Left */}
        {isFilterOpen && (
          <div 
            className="fixed inset-0 z-[99999] flex flex-col justify-end md:flex-row md:justify-start md:items-stretch bg-black/10 backdrop-blur-xs animate-fade-in" 
            style={{ height: '100dvh' }}
          >
            <div 
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 cursor-pointer bg-black/20"
              aria-hidden="true"
            />
            
            <div className="relative bg-white h-[85dvh] md:h-full w-full md:max-w-sm rounded-t-[24px] md:rounded-none border-r border-gray-100 shadow-2xl p-6 flex flex-col animate-slide-up md:animate-slide-right overflow-hidden z-10">
              
              {/* Drawer Controls Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5 shrink-0 relative">
                <div className="md:hidden absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-200 rounded-full" />
                <h2 className="font-medium text-[13px] text-gray-400 tracking-wider uppercase">
                  Filters
                </h2>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-label="Close filters panel"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Dynamic Scroll Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain pr-1 pb-20 md:pb-4">
                <FilterSidebar {...filterProps} />
              </div>

              {/* Apply Filters Lower Sticky Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 md:relative md:p-0 md:border-0 md:bg-transparent md:mt-auto md:pt-4 shrink-0 z-30">
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full h-11 bg-gray-950 hover:bg-black text-white text-[12px] font-medium tracking-wider uppercase rounded-xl transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sorting Option Bottom Tray */}
        {isSortDrawerOpen && (
          <div className="fixed inset-0 z-[100000] flex flex-col justify-end md:hidden" style={{ height: '100dvh' }}>
            <div 
              onClick={() => setIsSortDrawerOpen(false)} 
              className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-300"
            />
            
            <div className="relative bg-white rounded-t-[24px] p-6 shadow-2xl flex flex-col max-h-[50dvh] z-10 w-full animate-slide-up pb-safe border-t border-gray-100">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5 shrink-0" />
              
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                <h3 className="text-[12px] font-medium tracking-wider text-gray-400 uppercase">Sort</h3>
                <button onClick={() => setIsSortDrawerOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 cursor-pointer">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto">
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sort === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateFilters({ sort: option.value })
                        setIsSortDrawerOpen(false)
                      }}
                      className={`w-full h-12 px-4 rounded-xl flex items-center justify-between text-left text-[14px] transition-colors cursor-pointer ${
                        isSelected ? 'bg-stone-50/60 font-semibold text-gray-900' : 'text-gray-600 hover:bg-stone-50/30'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" strokeWidth={2} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Immersive Storefront Grid Display Area (Locked 2-mobile, 4-desktop) */}
        <div className="w-full min-h-[400px]">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white border border-gray-50 rounded-xl flex flex-col items-center px-4">
              <SearchX className="w-12 h-12 text-stone-200 mb-4" strokeWidth={1.5} />
              <h3 className="text-[14px] font-medium text-gray-900 tracking-wide">No items found</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Try adjusting your filters or active query bounds</p>
              <button onClick={clearFilters} className="mt-5 h-10 px-6 bg-gray-900 hover:bg-black text-white text-[11px] font-bold tracking-widest uppercase rounded-full transition-colors cursor-pointer">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-x-4 gap-y-8 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Track Control Trigger */}
          {visibleCount < filteredProducts.length && (
            <div className="mt-16 flex justify-center pb-12">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="h-11 px-8 bg-gray-950 hover:bg-black text-white rounded-full text-[12px] font-medium transition-all shadow-sm cursor-pointer uppercase tracking-wider active:scale-[0.98]"
              >
                Load More Items
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}