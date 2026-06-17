// src/components/checkout/OrderSummary.tsx

import Image from 'next/image'
import React, { useState } from 'react'
import { getProductImageUrl } from '@/lib/supabase/storage'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { ChevronDown, ChevronUp, Lock, Tag, Sliders } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
  original_price?: number
  variant_string?: string // ⚡ Snapshotted option label string
  is_wholesale_enabled?: boolean
  wholesale_min_qty?: number
}

interface OrderSummaryProps {
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  shippingMethod: 'delivery' | 'pickup'
  ctaText?: string
  onCtaClick?: () => void
  isCtaDisabled?: boolean
  showCtaSpinner?: boolean
}

function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  shippingMethod,
  ctaText,
  onCtaClick,
  isCtaDisabled,
  showCtaSpinner
}: OrderSummaryProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showScrollIndicator, setShowScrollIndicator] = useState(items.length > 3)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isAtBottom = Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 3
    if (isAtBottom && showScrollIndicator) {
      setShowScrollIndicator(false)
    } else if (!isAtBottom && items.length > 3 && !showScrollIndicator) {
      setShowScrollIndicator(true)
    }
  }

  return (
    <div className="w-full bg-white flex flex-col gap-4 font-sans antialiased text-left select-none" suppressHydrationWarning>
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-[27px] font-normal text-gray-900 tracking-tight capitalize">
          Order Summary
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-[13px] font-semibold transition-colors cursor-pointer capitalize border-none outline-none bg-transparent"
        >
          <span>{isExpanded ? 'Hide Items' : 'Show Items'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" strokeWidth={2} /> : <ChevronDown className="w-4 h-4" strokeWidth={2} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="relative">
          <div 
            onScroll={handleScroll}
            className="flex flex-col gap-1 max-h-[260px] overflow-y-auto no-scrollbar mb-2 pr-1 scroll-smooth"
          >
            {items.map((item) => {
              const imageUrl = item.image ? getProductImageUrl(item.image) : '/placeholder-product.svg'
              
              // ⚡ BIG-TECH ENGINE LOGIC: Detect wholesale thresholds dynamically
              const isWholesaleApplied = !!(item.original_price && item.price < item.original_price);
              
              // ⚡ FIXED: Fallback parser automatically appends variant tags if the string name is clean
              const cleanProductName = item.name.split(' (')[0]
              const displayHeadingName = item.variant_string && !item.name.includes(`(${item.variant_string})`)
                ? `${cleanProductName} (${item.variant_string})`
                : item.name

              return (
                <div key={item.id} className="flex gap-4 items-start py-3 px-1 w-full border-b border-gray-50 last:border-none">
                  
                  <div className="relative w-12 h-12 rounded-xl bg-[#F1F3F4] border border-gray-100 overflow-hidden shrink-0 mt-0.5">
                    <Image 
                      src={imageUrl}
                      alt={displayHeadingName} 
                      fill
                      sizes="48px"
                      className="object-contain p-1 mix-blend-multiply" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-[14px] sm:text-[15px] font-semibold text-gray-900 line-clamp-2 leading-tight capitalize">
                      {displayHeadingName.toLowerCase()}
                    </h4>
                    
                    {/* META RULES SUITE BADGES DYNAMIC DRAWERS */}
                    <div className="flex flex-col gap-1 pt-0.5">
                      {isWholesaleApplied && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit lowercase">
                          <Tag className="w-2.5 h-3" /> wholesale rate applied
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium pt-0.5">
                      <span>Qty: {item.quantity}</span>
                      <span className="text-gray-300">•</span>
                      <span>{formatCurrency(item.price)} each</span>
                    </div>
                  </div>

                  <div className="text-[14px] sm:text-[15px] font-semibold text-gray-900 shrink-0 ml-auto pt-0.5">
                    {formatCurrency(item.price * item.quantity)}
                  </div>

                </div>
              )
            })}
          </div>
          
          {showScrollIndicator && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce pointer-events-none">
              <ChevronDown className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 text-[14px] text-gray-500 font-normal pt-1 w-full">
        <div className="flex justify-between items-baseline">
          <span className="capitalize">Subtotal ({totalItems} Items):</span>
          <span className="text-gray-900 font-medium whitespace-nowrap">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between items-baseline border-t border-gray-50 pt-4 mt-1">
          <span className="capitalize">Shipping Charges:</span>
          <span className={shipping === 0 ? "text-emerald-700 font-semibold normal whitespace-nowrap" : "text-gray-900 font-medium whitespace-nowrap"}>
            {shippingMethod === 'pickup' ? 'Free' : (shipping === 0 ? 'Free shipping' : formatCurrency(shipping))}
          </span>
        </div>
        
        <div className="border-t border-gray-100 pt-4 mt-2 w-full">
          <div className="flex justify-between items-baseline text-gray-900 font-semibold">
            <span className="text-[21px] font-medium text-gray-900 capitalize">Total Payable:</span>
            <span className="text-[23px] font-bold tracking-tight text-gray-900 whitespace-nowrap">
              {formatCurrency(total)}
            </span>
          </div>
          
          {total > 0 && (
            <div className="text-right text-[13px] text-gray-400 font-normal mt-1.5 italic tracking-wide capitalise">
              {numberToIndianWords(total)} rupees only
            </div>
          )}
        </div>
      </div>

      {ctaText && onCtaClick && (
        <div className="hidden md:block pt-4 w-full">
          <button
            type="button"
            onClick={onCtaClick}
            disabled={isCtaDisabled}
            className="w-full h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[15px] font-medium tracking-wide transition-all disabled:opacity-50 cursor-pointer border-none outline-none flex items-center justify-center gap-2"
          >
            {showCtaSpinner ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {ctaText.includes('Pay') && <Lock className="w-4 h-4 text-white/90" strokeWidth={2} />}
                <span>{ctaText}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default React.memo(OrderSummary)