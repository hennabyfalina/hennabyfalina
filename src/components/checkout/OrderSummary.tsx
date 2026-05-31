// src/components/checkout/OrderSummary.tsx

import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { calculateTaxBreakdown } from '@/lib/tax'
import StarRating from '@/components/product/StarRating'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface OrderSummaryProps {
  items: Array<{
    name: string
    quantity: number
    price: number
    image?: string
    original_price?: number
    printing_type?: string
    rating?: number | null
    review_count?: number | null
    artwork_urls?: string[] 
    printing_instructions?: string | null
    customization_details?: any // To handle potential nested structure
  }>
  subtotal: number
  shipping: number
  total: number
  shippingMethod: 'delivery' | 'pickup'
}

function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  shippingMethod
}: OrderSummaryProps) {
  const taxInfo = calculateTaxBreakdown(subtotal)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const [isExpanded, setIsExpanded] = useState(false)
  const [, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  return (
    <div className="bg-white rounded-sm border border-[#D5D9D9] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-[#D5D9D9] pb-2">
        <h2 className="text-lg font-bold text-[#0F1111]">Order Summary</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-[#007185] hover:text-[#C7511F] flex items-center gap-1 text-sm font-bold cursor-pointer transition-colors"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto overscroll-contain pr-1 no-scrollbar mb-4">
            {items.map((item, index) => {
              let imageUrl = '/placeholder-product.svg'
              if (item.image) {
                imageUrl = item.image.startsWith('http') || item.image.startsWith('/') 
                  ? item.image 
                  : getPublicUrl(item.image)
              }
              
              return (
                <div key={index} className="flex gap-4 items-start border-b border-[#E7E7E7] pb-4 last:border-0 last:pb-0">
                  <div className="relative w-16 h-16 rounded-sm bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                    <Image 
                      src={imageUrl}
                      alt={item.name} 
                      fill 
                      sizes="64px"
                      className="object-cover p-1 mix-blend-multiply" 
                      unoptimized={imageUrl.startsWith('http') || imageUrl.includes('supabase')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 line-clamp-2 leading-snug">{item.name}</h4>
                    <div className="mt-1 mb-1">
                      <StarRating rating={item.rating ?? 4.5} reviewCount={0} hideReviewCount={true} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <p className="text-base font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.price)}</p>
                      {item.original_price && item.original_price > item.price && (
                        <p className="text-sm text-gray-500 line-through whitespace-nowrap">{formatCurrency(item.original_price)}</p>
                      )}
                    </div>
                    
                    {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                      <div className="mt-2 text-xs text-gray-700 bg-blue-50/50 p-2 rounded-md border border-blue-100/50 space-y-1">
                        <p><span className="font-bold text-gray-900">Customization:</span> {item.printing_type}</p>
                        {/* Check both item.artwork_urls and nested customization_details */}
                        {(item.artwork_urls?.length || item.customization_details?.artwork_urls?.length) > 0 && (
                          <p className="text-[#007185] font-medium">
                            ({(item.artwork_urls?.length || item.customization_details?.artwork_urls?.length)} file{(item.artwork_urls?.length || item.customization_details?.artwork_urls?.length) > 1 ? 's' : ''} included)
                          </p>
                        )}
                        {(item.printing_instructions || item.customization_details?.printing_instructions) && (
                          <p className="text-gray-600 italic">
                            <span className="font-semibold not-italic text-gray-800">Notes:</span> &quot;{item.printing_instructions || item.customization_details?.printing_instructions}&quot;
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-start gap-2 mt-1 flex-wrap">
                      <p className="text-sm text-gray-700 font-medium">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-base font-semibold text-gray-900 shrink-0 mt-0.5 whitespace-nowrap ml-2">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[#D5D9D9] pt-4 mb-4" />
        </>
      )}

      <div className="space-y-2.5 text-base text-[#0F1111]">
        <div className="flex justify-between gap-2">
          <span>Items ({totalItems}):</span>
          <span className="font-medium whitespace-nowrap ml-2">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between gap-2 text-sm text-gray-600 pt-1">
          <span>Base Price:</span>
          <span className="whitespace-nowrap ml-2">{formatCurrency(taxInfo.basePrice)}</span>
        </div>
        <div className="flex justify-between gap-2 text-sm text-gray-600 pb-1">
          <span>Total GST (18%):</span>
          <span className="whitespace-nowrap ml-2">{formatCurrency(taxInfo.totalGST)}</span>
        </div>

        <div className="flex justify-between gap-2 border-t border-dashed border-gray-200 pt-2 mt-1">
          <span>Shipping:</span>
          {shippingMethod === 'pickup' ? (
            <span className="font-medium text-green-600 whitespace-nowrap ml-2">Free (Pickup)</span>
          ) : shipping === 0 ? (
            <span className="font-medium text-green-600 whitespace-nowrap ml-2">Free</span>
          ) : (
            <span className="font-medium whitespace-nowrap ml-2">{formatCurrency(shipping)}</span>
          )}
        </div>
        
        <div className="border-t border-[#D5D9D9] pt-3 mt-3">
          <div className="flex justify-between items-center gap-2">
            <span className="text-lg font-bold text-[#B12704] shrink-0">Order Total:</span>
            <span className="text-xl font-bold text-[#B12704] whitespace-nowrap ml-2">{formatCurrency(total)}</span>
          </div>
          {total > 0 && (
             <div className="text-right text-[13px] text-gray-500 mt-1.5 italic">
              {numberToIndianWords(total)}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link 
              href="/cart" 
              className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer font-medium"
            >
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(OrderSummary)