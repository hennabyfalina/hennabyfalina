// src/components/product/RecentlyBoughtCarousel.tsx

'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { Product } from '@/types/database.types'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import { B2B_CONSTANTS } from '@/config/b2b-rules'

interface RecentlyBoughtCarouselProps {
  userId: string | null;
}

export default function RecentlyBoughtCarousel({ userId }: RecentlyBoughtCarouselProps) {
  const [recentlyBought, setRecentlyBought] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    const fetchRecentlyBought = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await fetch('/api/user/recently-bought')
        if (!response.ok) throw new Error('Failed to fetch recently bought products')
        const products: Product[] = await response.json()
        setRecentlyBought(products)
      } catch (error) {
        console.error('Error fetching recently bought products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentlyBought()
  }, [userId])

  if (loading) {
    return (
      <div className="bg-white p-4 sm:p-5 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] overflow-hidden w-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="flex gap-4 pb-6 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[220px] flex-shrink-0 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-sm mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!userId || recentlyBought.length === 0) {
    return null
  }

  const handleAddAllToCart = async () => {
    if (recentlyBought.length === 0) return
    setIsAdding(true)
    try {
      const retailMin = B2B_CONSTANTS.RETAIL_MIN_QTY
      // B2B Validation: Only add products that have at least the minimum retail stock
      const availableProducts = recentlyBought.filter(p => (p.stock ?? retailMin) >= retailMin)
      
      await Promise.all(availableProducts.map(async (product) => {
        const sellingPrice = product.selling_price ?? product.price ?? 0
        // Dynamic bulk pricing check based on the new B2B minimums
        const finalPrice = product.bulk_price && retailMin >= (product.bulk_min_quantity || B2B_CONSTANTS.WHOLESALE_MIN_QTY) 
          ? product.bulk_price 
          : sellingPrice

        await addItem({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: finalPrice,
          quantity: retailMin,
          image: product.images?.[0] || '',
          stock: product.stock,
          category_id: product.category_id || null,
          description: product.description || null,
          original_price: product.price,
          bulk_price: product.bulk_price || null,
          bulk_min_quantity: product.bulk_min_quantity || null,
          rating: product.rating || null,
          review_count: product.review_count || null,
          selling_price: sellingPrice,
        })
      }))
      showToast(`Added ${availableProducts.length} items to Cart`, 'success')
    } catch (error) {
      showToast('Failed to add some items to cart', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] overflow-hidden w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Buy Again</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5 hidden sm:block">Quick reorder base retail configurations (Min. Qty: {B2B_CONSTANTS.RETAIL_MIN_QTY})</p>
        </div>
        <button
          onClick={handleAddAllToCart}
          // B2B Validation: Disable button if NO products have enough stock for the minimum
          disabled={isAdding || recentlyBought.filter(p => (p.stock ?? B2B_CONSTANTS.RETAIL_MIN_QTY) >= B2B_CONSTANTS.RETAIL_MIN_QTY).length === 0}
          className="px-4 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-medium rounded-full shadow-sm border border-[#FCD200] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-[#0F1111] border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Add all to Cart</span>
          <span className="sm:hidden">Add All</span>
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 touch-pan-x overscroll-contain-x snap-carousel">
        {recentlyBought.map((product) => (
          <div key={product.id} className="w-[220px] flex-shrink-0 h-full">
            <ProductCard product={product} priority={false} productList={recentlyBought} />
          </div>
        ))}
      </div>
    </div>
  )
}