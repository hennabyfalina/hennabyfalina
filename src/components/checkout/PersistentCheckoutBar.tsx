// src/components/checkout/PersistentCheckoutBar.tsx

'use client'

import { formatCurrency } from '@/lib/utils'

interface PersistentCheckoutBarProps {
  subtotal: number
  shippingCost: number
  totalGST: number
  finalTotal: number
  totalItems: number
  shippingMethod: 'delivery' | 'pickup'
  onPlaceOrder: () => void
  isProcessing: boolean
  isSavingAddress: boolean
  isAddressFormOpen?: boolean
}

export default function PersistentCheckoutBar({
  subtotal,
  shippingCost,
  totalGST,
  finalTotal,
  totalItems,
  shippingMethod,
  onPlaceOrder,
  isProcessing,
  isSavingAddress,
  isAddressFormOpen = false
}: PersistentCheckoutBarProps) {
  // Disabled if address form open OR any operation in progress
  const isDisabled = isAddressFormOpen || isProcessing || isSavingAddress
  // Button text only changes during payment processing
  const buttonText = isProcessing ? 'Processing...' : 'Place Order'

  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] w-fit">
        <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-6 py-2.5 flex items-center gap-6 whitespace-nowrap">
          <div className="flex items-center gap-4 text-[13px]">
            <p className="text-gray-600">
              Items ({totalItems}): <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
            </p>
            <p className="text-gray-600">
              GST: <span className="font-bold text-gray-900">{formatCurrency(totalGST)}</span>
            </p>
            <p className="text-gray-600">
              Shipping: <span className="font-bold text-gray-900">
                {shippingMethod === 'pickup' ? 'Free' : (shippingCost === 0 ? 'Free' : formatCurrency(shippingCost))}
              </span>
            </p>
            <div className="pl-4 border-l border-gray-200 flex items-center gap-2">
              <span className="text-gray-900 font-bold">Total:</span>
              <span className="text-lg font-bold text-[#B12704]">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
          <button
            onClick={onPlaceOrder}
            disabled={isDisabled}
            className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {buttonText}
          </button>
        </div>
      </div>

      {/* Mobile version */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[110]">
        <div className="bg-white border-t border-gray-200 shadow-lg px-4 py-3 pb-safe">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Total Payable</span>
              <span className="text-lg font-bold text-[#B12704]">{formatCurrency(finalTotal)}</span>
            </div>
            <button
              onClick={onPlaceOrder}
              disabled={isDisabled}
              className="flex-1 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full text-sm font-bold text-center shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonText}
            </button>
          </div>
          {shippingCost > 0 && (
            <p className="text-[10px] text-gray-500 text-center mt-1">
              +{formatCurrency(shippingCost)} delivery
            </p>
          )}
        </div>
      </div>
    </>
  )
}