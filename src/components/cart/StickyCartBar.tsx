// src/components/cart/StickyCartBar.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/store/cart.store'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

interface StickyCartBarProps {
  totalPrice: number
}

export default function StickyCartBar({ totalPrice }: StickyCartBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const router = useRouter()
  const itemCount = useCartStore((state) => state.items.length)

  const shippingCost = totalPrice > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const finalTotal = totalPrice + shippingCost

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Target the order summary section (right column)
    const target = document.getElementById('order-summary-section')
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when the order summary is scrolled out of view (top above viewport)
        const shouldShow = !entry.isIntersecting && entry.boundingClientRect.top < 0
        setIsVisible(shouldShow)
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    )

    observer.observe(target)
    observerRef.current = observer

    return () => observer.disconnect()
  }, [isMounted])

  const handleProceedToBuy = () => {
    router.push('/checkout')
  }

  if (!isMounted) return null

  return (
    <>
      {/* Desktop Sticky Bar (top anchored below navbar) */}
      <div
        className={`
          fixed top-[73px] left-0 right-0 z-[110] hidden md:block
          transition-all duration-300 ease-in-out
          bg-white border-b border-gray-200 shadow-lg
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
        `}
      >
        <div className="max-w-[1500px] mx-auto px-6 py-3 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):</span>
            <span className="text-xl font-bold text-[#0F1111]">
              {formatCurrency(finalTotal)}
              {shippingCost > 0 && <span className="ml-2 text-xs font-normal text-gray-500">(Incl. {formatCurrency(shippingCost)} delivery)</span>}
              {shippingCost === 0 && <span className="ml-2 text-xs font-normal text-green-600">(Free Delivery)</span>}
            </span>
          </div>
          <button
            onClick={handleProceedToBuy}
            className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-sm font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            Proceed to Buy
          </button>
        </div>
      </div>

      {/* Mobile Sticky Bar (bottom anchored above bottom nav) */}
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
              <span className="text-xl font-extrabold text-[#0F1111] tracking-tight">{formatCurrency(finalTotal)}</span>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 rounded-sm">{itemCount}</span>
            </div>
            {shippingCost > 0 ? (
              <span className="text-[11px] text-gray-600 font-medium mt-0.5">(Incl. {formatCurrency(shippingCost)} delivery)</span>
            ) : (
              <span className="text-[11px] text-green-700 font-bold mt-0.5">FREE Delivery</span>
            )}
          </div>
          <button
            onClick={handleProceedToBuy}
            className="flex-1 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-sm font-bold text-center shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            Proceed to Buy
          </button>
        </div>
      </div>
    </>
  )
}