// src/components/product/RecentlyBoughtCarousel.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/components/product/ProductCard'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

// 🚨 COMPONENT: Skeleton Loader (mimics the ProductCard shape)
function ProductCardSkeleton() {
  return (
    <div className="w-[200px] sm:w-[240px] flex-shrink-0 h-full bg-white border border-gray-200 rounded-md overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100 w-full" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-50 rounded w-1/2" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mt-4" />
        <div className="h-8 bg-gray-100 rounded-full w-full mt-2" />
      </div>
    </div>
  )
}

interface RecentlyBoughtCarouselProps {
  userId: string | null;
}

export default function RecentlyBoughtCarousel({ userId }: RecentlyBoughtCarouselProps) {
  const [recentlyBought, setRecentlyBought] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const supabase = createClient()
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const fetchRecentlyBought = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await fetch('/api/user/recently-bought')
        if (response.ok) {
          const products: Product[] = await response.json()
          setRecentlyBought(Array.isArray(products) ? products : [])
        } else {
          // If 404, 401 or other errors, user might not have history or session is invalid
          setRecentlyBought([])
        }
      } catch (error) {
        console.error('Error fetching recently bought products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentlyBought()
  }, [userId])

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [recentlyBought])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = Math.min(scrollContainerRef.current.clientWidth * 0.8, 800)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(checkScroll, 350)
    }
  }

  const handleAddAllToCart = async () => {
    if (recentlyBought.length === 0) return
    setIsAdding(true)
    let addedCount = 0
    
    try {
      for (const p of recentlyBought) {
        const { data: fullProduct, error } = await supabase
          .from('products')
          .select('*, pricing_tiers:product_pricing_tiers(*)')
          .eq('id', p.id)
          .single()

        if (error || !fullProduct) continue

        const tiers = fullProduct.pricing_tiers?.filter((t: any) => !t.is_deleted) || []
        const defaultTier = tiers.length > 0 
          ? tiers.find((t: any) => t.min_quantity === 1) || 
            tiers.sort((a: any, b: any) => a.min_quantity - b.min_quantity)[0]
          : null;
        
        const targetQty = defaultTier ? defaultTier.min_quantity : 1;
        const targetPrice = defaultTier ? defaultTier.selling_price : (fullProduct.selling_price ?? fullProduct.price);

        if (fullProduct.stock >= targetQty) {
          await addItem({
            product_id: fullProduct.id,
            name: fullProduct.name,
            slug: fullProduct.slug,
            price: targetPrice,
            quantity: targetQty,
            image: fullProduct.images?.[0] || '',
            stock: fullProduct.stock,
            category_id: fullProduct.category_id || null,
            description: fullProduct.description || null,
            original_price: fullProduct.price,
            rating: fullProduct.rating || null,
            review_count: fullProduct.review_count || null,
            selling_price: fullProduct.selling_price || fullProduct.price,
            printing_type: defaultTier ? defaultTier.tier_name : 'Retail (Readymade)',
            artwork_urls: [],
            artwork_sizes: [],
            printing_instructions: null,
            pricing_tiers: tiers 
          })
          addedCount++
        }
      }
      if (addedCount > 0) showToast(`${addedCount} favorites added to cart`, 'success')
    } catch (error) {
      showToast('Error updating cart', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-white p-4 sm:p-6 rounded-md border border-gray-200 mt-10">
        <div className="h-7 w-48 bg-gray-100 rounded mb-6 animate-pulse" />
        <div className="flex gap-4 sm:gap-6 overflow-hidden">
          {[...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!recentlyBought || recentlyBought.length === 0) return null

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-md border border-gray-200 shadow-sm mt-10 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F1111] tracking-tight">Buy it again</h3>
        </div>
        <button
          onClick={handleAddAllToCart}
          disabled={isAdding}
          className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-bold rounded-full shadow-sm border border-[#FCD200] transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          {isAdding ? 'Processing...' : 'Add all to Cart'}
        </button>
      </div>
      
      <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0 -mt-7">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[40%] -translate-y-1/2 -ml-3 sm:-ml-5 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex"
          >
            <ChevronLeft className="w-5 h-5 pr-0.5" />
          </button>
        )}
        
        <div ref={scrollContainerRef} onScroll={checkScroll} className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-6 scroll-smooth snap-x">
          {recentlyBought.map((product) => (
            <div key={product.id} className="w-[200px] sm:w-[240px] flex-shrink-0 h-full snap-start">
              <ProductCard 
                product={product} 
                productList={recentlyBought} 
                hideMinOrderBadge={true} // 🚨 TRIGGER: Hide badge only in this carousel
              />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 -mr-3 sm:-mr-5 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex"
          >
            <ChevronRight className="w-5 h-5 pl-0.5" />
          </button>
        )}
      </div>
    </div>
  )
}