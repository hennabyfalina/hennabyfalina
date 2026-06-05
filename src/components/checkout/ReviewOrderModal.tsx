// src/components/checkout/ReviewOrderModal.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, MapPin, Store, ChevronDown, ChevronUp } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { AddressFormData } from '@/components/checkout/AddressForm'

interface ReviewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isProcessing: boolean
  shippingMethod: 'delivery' | 'pickup'
  formData: AddressFormData
  items: any[]
  totalItems: number
  totalPrice: number
  shippingCost: number
  taxBreakdown: { basePrice: number; totalGST: number; cgst: number; sgst: number }
  finalTotal: number
}

export default function ReviewOrderModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  shippingMethod,
  formData,
  items,
  totalItems,
  totalPrice,
  shippingCost,
  taxBreakdown,
  finalTotal
}: ReviewOrderModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isItemsExpanded, setIsItemsExpanded] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    // Use a small threshold (2px) to account for rounding errors
    setIsAtBottom(scrollBottom <= 2);
  };

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <div className="absolute inset-0" onClick={!isProcessing ? onClose : undefined} style={{ touchAction: 'none' }} />
      
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-[#D5D9D9] shrink-0">
          <h2 className="text-2xl font-bold text-[#0F1111]">Review Your Order</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white no-scrollbar overscroll-contain">
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#0F1111] mb-3 border-b border-gray-100 pb-2">
                {shippingMethod === 'pickup' ? 'Pickup Details' : 'Shipping Address'}
              </h3>
              
              {shippingMethod === 'pickup' ? (
                <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col gap-4 text-[15px] text-gray-800 leading-relaxed">
                  <div className="flex gap-3 items-start">
                  <Store className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                      <p className="font-bold text-sm">{siteConfig.name}</p>
                      <p className="text-sm">
                      {siteConfig.address.line1}
                      {siteConfig.address.line2 ? `, ${siteConfig.address.line2}` : ''}
                      , {siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}
                    </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 ml-8 space-y-2">
                    <div className="flex flex-col gap-2">
                      <p>
                        <span className="font-bold text-gray-900">Pickup Contact: </span>
                        <span className="text-gray-700">{formData.name}</span>
                      </p>
                      <p>
                        <span className="font-bold text-gray-900">Phone: </span>
                        <span className="text-gray-700">{formData.phone}</span>
                      </p>
                      <p>
                        <span className="font-bold text-gray-900">Pincode: </span>
                        <span className="text-gray-700">{formData.pincode}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-green-700 font-medium">
                        Please bring your order confirmation WhatsApp message.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col gap-4 text-[15px] text-gray-800 leading-relaxed">
                  <div className="flex gap-3 items-start">
                    <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900 mb-1">Home Delivery</p>
                    <p>
                      <span className="font-bold text-gray-900">Name: </span>
                      <span className="text-gray-700">{formData.name || formData.fullName}</span>
                    </p>
                    <p>
                      <span className="font-bold text-gray-900">Address: </span>
                      <span className="text-gray-700">
                        {formData.addressLine1}
                        {formData.addressLine2 ? `, ${formData.addressLine2}` : ''}
                        , {formData.city} - {formData.pincode}, {formData.state}
                      </span>
                    </p>
                    <p>
                      <span className="font-bold text-gray-900">Phone: </span>
                      <span className="text-gray-700">{formData.phone}</span>
                    </p>
                      {(formData.landmark || formData.delivery_instructions) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {formData.landmark && (
                            <p>
                              <span className="font-bold text-gray-900">Landmark: </span>
                              <span className="text-gray-700">{formData.landmark}</span>
                            </p>
                          )}
                          {formData.delivery_instructions && (
                            <p>
                              <span className="font-bold text-gray-900">Instructions: </span>
                              <span className="text-gray-700">{formData.delivery_instructions}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-[#0F1111]">Order Summary</h3>
                <button 
                  onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                  className="p-1 text-[#007185] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  {isItemsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              <div className="space-y-3">
                <div 
                  onScroll={handleScroll}
                  className={`overflow-y-auto pr-2 space-y-3 no-scrollbar border border-gray-100 p-2 rounded-sm bg-gray-50 transition-all duration-300 relative ${isItemsExpanded ? 'max-h-[280px] opacity-100' : 'max-h-0 py-0 border-0 opacity-0 overflow-hidden'}`}
                >
                  {items.map((item, index) => {
                    const imgUrl = item.image ? (item.image.startsWith('http') ? item.image : getPublicUrl(item.image)) : '/placeholder-product.svg'
                    return (
                      <div key={index} className="flex gap-3 items-center bg-white p-2 rounded-sm border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 relative bg-gray-50 rounded-sm overflow-hidden shrink-0 border border-gray-200">
                           <Image src={imgUrl} alt={item.name} fill sizes="48px" className="object-cover mix-blend-multiply" unoptimized={imgUrl.startsWith('http') || imgUrl.includes('supabase')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Qty: {item.quantity}</p>
                          {item.printing_type && item.printing_type !== 'None' && (
                            <div className="mt-1.5 text-[10px] text-gray-700 bg-blue-50/50 p-1.5 rounded border border-blue-100/50 space-y-0.5">
                              <p><span className="font-bold text-gray-900">Type:</span> {item.printing_type}</p>
                              {(() => {
                                const parseUrls = (data: any): string[] => {
                                  if (!data) return [];
                                  if (Array.isArray(data)) return data;
                                  if (typeof data === 'string') {
                                    try { const parsed = JSON.parse(data); if (Array.isArray(parsed)) return parsed; } catch { if (data.trim().length > 0) return [data]; }
                                  }
                                  return [];
                                };
                                const urls = parseUrls(item.artwork_urls).length > 0 ? parseUrls(item.artwork_urls) : parseUrls(item.customization_details?.artwork_urls);
                                if (urls.length > 0) {
                                  return <p className="text-[#007185] font-medium">({urls.length} file{urls.length > 1 ? 's' : ''} attached)</p>;
                                }
                                return null;
                              })()}
                              {(item.printing_instructions || item.customization_details?.printing_instructions) && (
                                <p className="text-gray-600 italic line-clamp-2" title={item.printing_instructions || item.customization_details?.printing_instructions}>
                                  <span className="font-semibold not-italic text-gray-800">Note:</span> &quot;{item.printing_instructions || item.customization_details?.printing_instructions}&quot;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Scroll Indicator for Mobile/Small views */}
                  {items.length >= 2 && isItemsExpanded && !isAtBottom && (
                    <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none flex items-end justify-center pb-1">
                      <ChevronDown className="w-6 h-6 text-gray-900 animate-bounce stroke-[3]" />
                    </div>
                  )}
                </div>
                
                <div className="pt-2 space-y-1.5 text-sm text-[#0F1111]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({totalItems}):</span>
                    <span>{formatCurrency(taxBreakdown.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span>{shippingMethod === 'pickup' ? 'Free (Pickup)' : (shippingCost === 0 ? 'Free' : formatCurrency(shippingCost))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18%):</span>
                    <span>{formatCurrency(taxBreakdown.totalGST)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t border-[#D5D9D9] text-[#B12704]">
                  <span>Order Total:</span>
                  <span>{finalTotal ? formatCurrency(finalTotal) : '...'}</span>
                </div>
              </div>
            </div>

          </div>
          
        </div>
        
        <div className="p-4 bg-white border-t border-[#D5D9D9] shrink-0 flex flex-col sm:flex-row justify-end gap-3 rounded-b-sm relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2.5 text-sm font-bold text-[#0F1111] bg-gray-100 border border-[#D5D9D9] rounded-sm hover:bg-gray-200 transition-colors disabled:opacity-50 sm:w-auto w-full cursor-pointer"
          >
            Edit Details
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-8 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 shadow-sm focus:ring-2 focus:ring-[#007185] sm:w-auto w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <><div className="w-4 h-4 border-2 border-[#0F1111] border-t-transparent rounded-full animate-spin" /> Processing...</>
            ) : (
              'Place Your Order'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}