// src/components/checkout/ReviewOrderModal.tsx

'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { X, MapPin, Store } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { PRINTING_TIERS } from '@/config/b2b-rules'
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
  hasBulkDiscount: boolean
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
  finalTotal,
  hasBulkDiscount
}: ReviewOrderModalProps) {
  
  // Block background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#F0F2F2] rounded-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#D5D9D9] shrink-0">
          <h3 className="text-xl font-bold text-[#0F1111]">Review Your Order</h3>
          <button onClick={onClose} disabled={isProcessing} className="p-1 hover:bg-gray-100 rounded-sm transition-colors disabled:opacity-50 cursor-pointer">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          <div className="bg-white border border-[#D5D9D9] p-3 rounded-sm flex items-center justify-between">
            <span className="font-bold text-[#0F1111]">Delivery Method</span>
            <span className="text-[#007185] font-bold flex items-center gap-1.5">
              {shippingMethod === 'pickup' ? <Store className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              {shippingMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
            </span>
          </div>

          <div className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-[#D5D9D9] font-bold text-[#0F1111]">
              {shippingMethod === 'pickup' ? 'Pickup Details' : 'Shipping Address'}
            </div>
            <div className="p-4 text-sm text-[#0F1111] space-y-3">
              {shippingMethod === 'pickup' ? (
                <>
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-gray-500 font-medium">Name:</span>
                    <span>{formData.name}</span>
                    <span className="text-gray-500 font-medium">Phone:</span>
                    <span>{formData.phone}</span>
                    <span className="text-gray-500 font-medium">Pincode:</span>
                    <span>{formData.pincode}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#D5D9D9]">
                    <p className="font-bold mb-1 text-[#007185]">{siteConfig.name}</p>
                    <p>{siteConfig.address.line1}</p>
                    <p>{siteConfig.address.line2}</p>
                    <p>{siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.country} – {siteConfig.address.pincode}</p>
                    <p className="mt-1"><span className="text-gray-500 font-medium">Phone: </span>{siteConfig.contact.phone.primary}, {siteConfig.contact.phone.secondary}</p>
                    <p className="mt-1"><span className="text-gray-500 font-medium">Hours: </span>{siteConfig.business.workingHours}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-gray-500 font-medium">Name:</span>
                    <span>{formData.name}</span>
                    <span className="text-gray-500 font-medium">Phone:</span>
                    <span>{formData.phone}</span>
                    <span className="text-gray-500 font-medium">Address:</span>
                    <span>
                      {formData.addressLine1}
                      {formData.addressLine2 && <>, {formData.addressLine2}</>}
                      <br/>{formData.city}, {formData.state} - {formData.pincode}
                    </span>
                  </div>
                  {(formData.landmark || formData.delivery_instructions) && (
                    <div className="mt-3 pt-3 border-t border-[#D5D9D9] grid grid-cols-[100px_1fr] gap-2">
                      {formData.landmark && (
                        <>
                          <span className="text-gray-500 font-medium">Landmark:</span>
                          <span>{formData.landmark}</span>
                        </>
                      )}
                      {formData.delivery_instructions && (
                        <>
                          <span className="text-gray-500 font-medium">Instructions:</span>
                          <span>{formData.delivery_instructions}</span>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 🚨 ORDER ITEMS WITH B2B METADATA */}
          <div className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-[#D5D9D9] font-bold text-[#0F1111] flex justify-between">
              <span>Order Items</span>
              <span className="font-normal text-sm">{totalItems} items</span>
            </div>
            <div className="p-0 flex flex-col max-h-60 overflow-y-auto">
              {items.map((item: any, idx) => {
                const isBulkApplied = item.bulk_price && item.bulk_min_quantity && item.quantity >= item.bulk_min_quantity;
                const tier = PRINTING_TIERS.find(t => t.id === item.printing_type)
                
                let imageUrl = '/placeholder-product.svg'
                if (item.image) {
                  imageUrl = item.image.startsWith('http') || item.image.startsWith('/') 
                    ? item.image 
                    : getPublicUrl(item.image)
                }

                return (
                  <div key={idx} className="p-4 flex justify-between items-start gap-4 text-sm border-b border-[#E7E7E7] last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-sm bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                        <Image src={imageUrl} alt={item.name || 'Product'} fill sizes="48px" className="object-cover p-1 mix-blend-multiply" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#0F1111] line-clamp-2">{item.name || 'Product'}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-500">Qty: {item.quantity}</span>
                          {isBulkApplied && (
                            <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-sm">
                              Bulk Price
                            </span>
                          )}
                        </div>
                        {/* B2B Printing Selection Display */}
                        {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                          <div className="mt-2 text-xs text-gray-700 bg-blue-50/50 p-2 rounded-md border border-blue-100/50 space-y-1">
                            <p><span className="font-semibold text-gray-900">Customization:</span> {tier?.title || item.printing_type}</p>
                            
                            {/* 🚨 UPGRADED: Dynamic Array File Counter 🚨 */}
                            {item.artwork_urls && item.artwork_urls.length > 0 && (
                              <p className="text-[#007185] font-medium flex items-center gap-0.5">
                                [{item.artwork_urls.length} File(s) Attached]
                              </p>
                            )}
                            
                            {item.printing_instructions && (
                              <p className="text-gray-600 italic">
                                <span className="font-semibold not-italic text-gray-800">Notes:</span> "{item.printing_instructions}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-[#0F1111] whitespace-nowrap ml-2">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                )
              })}
            </div>
            
            {hasBulkDiscount && (
              <div className="bg-green-50 px-4 py-2 border-t border-[#D5D9D9] text-xs text-green-800 font-medium flex items-center justify-center">
                Wholesale discounts applied
              </div>
            )}
          </div>

          {/* 🚨 ORDER TOTAL WITH GST BREAKDOWN */}
          <div className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
            <div className="p-4 space-y-1.5 text-sm text-[#0F1111]">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-dashed border-[#D5D9D9] space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Base Amount (Excl. Tax):</span>
                  <span>{formatCurrency(taxBreakdown.basePrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total GST (18%):</span>
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
            className="px-8 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none flex items-center justify-center gap-2 sm:w-auto w-full relative overflow-hidden cursor-pointer"
          >
            {isProcessing ? 'Securing Order...' : 'Confirm & Pay'}
          </button>
        </div>

      </div>
    </div>
  )
}