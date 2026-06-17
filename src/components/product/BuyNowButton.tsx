// src/components/product/BuyNowButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'

interface BuyNowButtonProps {
  product: {
    id: string
    name: string
    slug: string
    retail_price: number
    wholesale_price: number | null
    wholesale_min_qty: number | null
    mrp?: number | null
    stock: number
    images: string[]
    category_id?: string | null
    description?: string | null
    rating?: number | null
    review_count?: number | null
    variant_name?: string | null
    variant_string?: string | null
    variants?: any
    is_retail_enabled: boolean
    is_wholesale_enabled: boolean
    is_variants_enabled: boolean
  }
  quantity?: number
  className?: string
}

export default function BuyNowButton({
  product,
  quantity = 1, 
  className = ''
}: BuyNowButtonProps) {
  const [isBuying, setIsBuying] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const router = useRouter()

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product || (product.stock ?? 0) <= 0) {
      showToast('Product is currently unavailable', 'error')
      return
    }

    setIsBuying(true)
    try {
      const activeVariantName = product.variant_name || product.variant_string || null
      
      // ⚡ FIXED: Formats names instantly to prevent missing variants at checkout
      const computedName = activeVariantName ? `${product.name} (${activeVariantName})` : product.name

      await addItem({
        product_id: product.id,
        name: computedName,
        slug: product.slug,
        quantity: quantity,
        image: product.images?.[0] || '',
        stock: product.stock,
        category_id: product.category_id || null,
        description: product.description || null,
        is_retail_enabled: product.is_retail_enabled,
        is_wholesale_enabled: product.is_wholesale_enabled,
        is_variants_enabled: product.is_variants_enabled,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        wholesale_min_qty: product.wholesale_min_qty,
        rating: product.rating || null,
        review_count: product.review_count || null,
        mrp: product.mrp || product.retail_price,
        variant_string: activeVariantName,
        variants: product.variants, 
      })

      router.push('/checkout')
    } catch (error) {
      showToast('Failed to process checkout', 'error')
    } finally {
      setIsBuying(false)
    }
  }

  const isOutOfStock = (product?.stock ?? 0) <= 0
  const defaultClasses = "w-full h-12 flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-widest bg-gray-900 hover:bg-black text-white rounded-full cursor-pointer disabled:opacity-40 disabled:bg-stone-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-sm active:scale-[0.99] border-none outline-none"

  return (
    <button 
      type="button" 
      onClick={handleBuyNow} 
      disabled={isBuying || isOutOfStock} 
      className={className || defaultClasses}
    >
      {isBuying ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{isOutOfStock ? 'Sold Out' : 'Buy It Now'}</span>
      )}
    </button>
  )
}