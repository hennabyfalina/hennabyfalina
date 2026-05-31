// src/components/product/StickyBuyBar.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'
import StarRating from './StarRating'

interface StickyBuyBarProps {
  product: any
  sellingPrice: number
  hasStock: boolean
  minQuantity: number
}

export default function StickyBuyBar({ product, sellingPrice, hasStock, minQuantity }: StickyBuyBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const searchParams = useSearchParams()
  const editItemId = searchParams?.get('edit_item') || null

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const getTargetElement = (): Element | null => {
      // Priority 1: Right-side action box
      const actionBox = document.getElementById('product-action-box')
      if (actionBox) return actionBox
      // Fallback
      const trigger = document.getElementById('buy-box-trigger')
      if (trigger) return trigger
      return document.querySelector('[data-product-interactive]')
    }

    // Longer delay ensures edit mode DOM is fully stable
    const timer = setTimeout(() => {
      const target = getTargetElement()
      if (!target) {
        console.warn('[StickyBuyBar] No target element found')
        return
      }

      // Disconnect old observer
      if (observerRef.current) observerRef.current.disconnect()

      // Create new observer
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const shouldShow = !entry.isIntersecting && entry.boundingClientRect.top < 0
          setIsVisible(shouldShow)
        },
        { threshold: 0, rootMargin: '0px 0px 0px 0px' }
      )

      observerRef.current.observe(target)
    }, 300) // Increased from 150ms

    return () => {
      clearTimeout(timer)
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [isMounted, product.id, editItemId]) // ✅ editItemId forces re-attach in edit mode

  if (!hasStock || !isMounted) return null

  // 🔒 SECURE DYNAMIC CALCULATION: Identify the true starting tier quantity criteria
  const tiers = product?.pricing_tiers || []
  const dynamicMinQuantity = tiers.length > 0 
    ? Math.min(...tiers.map((t: any) => t.min_quantity || 100)) 
    : (minQuantity || 100)

  const imageUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') || product.images[0].startsWith('/')
        ? product.images[0]
        : getPublicUrl(product.images[0]))
    : '/placeholder-product.svg'

  return (
    <>
      {/* Desktop Sticky Bar */}
      <div
        className={`
          fixed top-[73px] left-0 right-0 z-[110] hidden md:block
          transition-all duration-300 ease-in-out
          bg-white border-b border-gray-200 shadow-lg
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="max-w-[1500px] mx-auto px-6 py-3 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 relative shrink-0 bg-gray-50 rounded-sm border border-gray-100 p-0.5">
              <Image src={imageUrl} alt={product.name} fill className="object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-[#0F1111] truncate">{product.name}</h3>
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating ?? 4.5} reviewCount={product.review_count ?? 128} size="sm" />
                <span className="text-[10px] font-bold text-white bg-[#CC0C39] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  Min Order: {dynamicMinQuantity}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-xl font-bold text-[#0F1111] leading-none">{formatCurrency(sellingPrice)}</span>
              <span className="text-[10px] text-green-700 font-bold">In Stock</span>
            </div>
            <div className="w-40">
              <AddToCartButton
                product={product}
                quantity={dynamicMinQuantity}
                minQuantity={dynamicMinQuantity}
                requireCustomizationChoice={true}
                className="w-full py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div
        className={`
          fixed left-0 right-0 z-[110] md:hidden mobile-sticky-bar
          transition-all duration-300 ease-in-out
          bg-white border-t border-gray-200 shadow-lg
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-[#0F1111] tracking-tight">{formatCurrency(sellingPrice)}</span>
              <span className="text-xs font-bold text-white bg-[#CC0C39] px-2 py-0.5 rounded-sm uppercase scale-90 origin-left">
                Min: {dynamicMinQuantity}
              </span>
            </div>
            <span className="text-[11px] text-green-700 font-bold mt-0.5">In Stock</span>
          </div>
          <div className="flex-1">
            <AddToCartButton
              product={product}
              quantity={dynamicMinQuantity}
              minQuantity={dynamicMinQuantity}
              requireCustomizationChoice={true}
              className="w-full py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-sm font-bold text-center shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </>
  )
}