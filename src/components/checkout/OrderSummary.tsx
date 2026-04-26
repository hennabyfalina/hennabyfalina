// src/components/checkout/OrderSummary.tsx

import Image from 'next/image'
import React from 'react'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'

interface OrderSummaryProps {
  items: Array<{
    name: string
    quantity: number
    price: number
    image?: string
    original_price?: number
    bulk_price?: number | null
    bulk_min_quantity?: number | null
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
  return (
    <div className="bg-white rounded-sm border border-[#D5D9D9] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#0F1111] mb-4">Order Summary</h2>
      
      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 no-scrollbar mb-4">
        {items.map((item, index) => {
          let imageUrl = '/placeholder-product.svg'
          if (item.image) {
            imageUrl = item.image.startsWith('http') || item.image.startsWith('/') 
              ? item.image 
              : getPublicUrl(item.image)
          }
          
          return (
            <div key={index} className="flex gap-3 items-start">
              <div className="relative w-14 h-14 rounded-sm bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                <Image 
                  src={imageUrl}
                  alt={item.name} 
                  fill 
                  sizes="56px"
                  className="object-cover p-1" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(item.price)}</p>
                  {item.original_price && item.original_price > item.price && (
                    <p className="text-xs text-gray-500 line-through whitespace-nowrap">{formatCurrency(item.original_price)}</p>
                  )}
                </div>
                <div className="flex items-center justify-start gap-2 mt-1 flex-wrap">
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  {item.bulk_price && item.bulk_min_quantity && item.quantity >= item.bulk_min_quantity && (
                    <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-sm">
                      Bulk Price Applied
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900 shrink-0 mt-0.5 whitespace-nowrap ml-2">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-[#D5D9D9] pt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900 whitespace-nowrap ml-2">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Shipping</span>
          {shippingMethod === 'pickup' ? (
            <span className="font-medium text-green-600 whitespace-nowrap ml-2">Free (Pickup)</span>
          ) : shipping === 0 ? (
            <span className="font-medium text-green-600 whitespace-nowrap ml-2">Free</span>
          ) : (
          <span className="font-medium text-gray-900 whitespace-nowrap ml-2">{formatCurrency(shipping)}</span>
          )}
        </div>
        
        <div className="border-t border-[#D5D9D9] pt-2 mt-2">
          <div className="flex justify-between items-center gap-2">
            <span className="text-base font-bold text-gray-900 shrink-0">Total</span>
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap ml-2">{formatCurrency(total)}</span>
          </div>
          {total > 0 && (
            <div className="text-right text-[11px] text-gray-500 mt-1 italic">
              {numberToIndianWords(total)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(OrderSummary)