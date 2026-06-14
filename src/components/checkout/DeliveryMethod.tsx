// src/components/checkout/DeliveryMethod.tsx

'use client'

import { Package, Home } from 'lucide-react'

interface DeliveryMethodProps {
  shippingMethod: 'delivery' | 'pickup'
  onChange: (method: 'delivery' | 'pickup') => void
  disabled?: boolean
}

export default function DeliveryMethod({ 
  shippingMethod, 
  onChange, 
  disabled = false 
}: DeliveryMethodProps) {
  return (
    <div className="w-full font-sans antialiased text-left select-none">
      <div className="flex items-center p-1 bg-[#F1F3F4] rounded-xl sm:rounded-2xl max-w-md w-full relative">
        
        {/* Option A: Standard Delivery */}
        <button
          type="button"
          onClick={() => !disabled && onChange('delivery')}
          disabled={disabled}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 rounded-lg sm:rounded-xl text-[14px] sm:text-[15px] font-semibold transition-all duration-200 outline-none ${
            shippingMethod === 'delivery'
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Package className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${shippingMethod === 'delivery' ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={2} />
          <span className="tracking-tight capitalize">Standard Delivery</span>
        </button>

        {/* Option B: Home Pickup */}
        <button
          type="button"
          onClick={() => !disabled && onChange('pickup')}
          disabled={disabled}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 rounded-lg sm:rounded-xl text-[14px] sm:text-[15px] font-semibold transition-all duration-200 outline-none ${
            shippingMethod === 'pickup'
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Home className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${shippingMethod === 'pickup' ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={2} />
          <span className="tracking-tight capitalize">Home Pickup</span>
        </button>

      </div>
    </div>
  )
}