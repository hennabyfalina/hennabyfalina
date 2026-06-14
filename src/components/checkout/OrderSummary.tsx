// src/components/checkout/OrderSummary.tsx

import Image from 'next/image'
import React, { useState } from 'react'
import { getProductImageUrl } from '@/lib/supabase/storage'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
  original_price?: number
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

  return (
    <div className="w-full bg-white flex flex-col gap-4 font-sans antialiased text-left select-none" suppressHydrationWarning>
      
      {/* 🚀 FIXED: Upscaled order header layout weight to premium Capitalized case states */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-[27px] font-normal text-gray-900 tracking-tight capitalize">
          Order Summary
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-[13px] font-semibold transition-colors cursor-pointer capitalize"
        >
          <span>{isExpanded ? 'Hide Items' : 'Show Items'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" strokeWidth={2} /> : <ChevronDown className="w-4 h-4" strokeWidth={2} />}
        </button>
      </div>
      
      {/* Collapsible Product Shelf List */}
      {isExpanded && (
        <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto no-scrollbar mb-2 pr-1">
          {items.map((item) => {
            const imageUrl = item.image ? getProductImageUrl(item.image) : '/placeholder-product.svg'
            
            return (
              <div key={item.id} className="flex gap-4 items-center py-3 px-1 w-full">
                
                {/* Weightless Thumbnail Framework Box */}
                <div className="relative w-12 h-12 rounded-xl bg-[#F1F3F4] overflow-hidden shrink-0">
                  <Image 
                    src={imageUrl}
                    alt={item.name} 
                    fill
                    sizes="48px"
                    className="object-contain p-1 mix-blend-multiply" 
                  />
                </div>
                
                {/* Product Metadata Tiers */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="text-[14px] sm:text-[15px] font-semibold text-gray-900 line-clamp-1 leading-tight capitalize">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                    <span className="capitalize">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>

                {/* Right Cumulative Pricing Node */}
                <div className="text-[14px] sm:text-[15px] font-normal text-gray-900 shrink-0 ml-auto">
                  {formatCurrency(item.price * item.quantity)}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* 🚀 FIXED: Pure Capitalized typography calculation fields with enhanced medium-bold weighting */}
      <div className="space-y-4 text-[14px] text-gray-500 font-normal pt-1 w-full">
        
        <div className="flex justify-between items-baseline">
          <span className="capitalize">Subtotal ({totalItems} Items):</span>
          <span className="text-gray-900 font-normal whitespace-nowrap">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between items-baseline border-t border-gray-50 pt-4 mt-1">
          <span className="capitalize">Shipping Charges:</span>
          <span className={shipping === 0 ? "text-emerald-700 font-semibold capitalize whitespace-nowrap" : "text-gray-900 font-normal whitespace-nowrap"}>
            {shippingMethod === 'pickup' ? 'Free Pickup' : (shipping === 0 ? 'Complimentary' : formatCurrency(shipping))}
          </span>
        </div>
        
        {/* Total Final Execution Row */}
        <div className="border-t border-gray-100 pt-4 mt-2 w-full">
          <div className="flex justify-between items-baseline text-gray-900 font-semibold">
            <span className="text-[23px] capitalize">Total Payable:</span>
            <span className="text-[23px] font-bold tracking-tight text-gray-900 whitespace-nowrap">
              {formatCurrency(total)}
            </span>
          </div>
          
          {total > 0 && (
            <div className="text-right text-[15px] text-gray-400 font-normal mt-2 italic tracking-wide">
              {numberToIndianWords(total)}
            </div>
          )}
        </div>

      </div>

      {/* 💻 Desktop Smart Morphing CTA Button */}
      {ctaText && onCtaClick && (
        <div className="hidden md:block pt-4 w-full">
          <button
            type="button"
            onClick={onCtaClick}
            disabled={isCtaDisabled}
            className="w-full h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[15px] font-normal tracking-wide transition-all disabled:opacity-50 cursor-pointer normal shadow-none outline-none flex items-center justify-center gap-2"
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