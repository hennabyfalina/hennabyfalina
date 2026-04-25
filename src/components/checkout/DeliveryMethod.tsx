// src/components/checkout/DeliveryMethod.tsx

'use client'

import { Package, Store, Check } from 'lucide-react'

interface DeliveryMethodProps {
  shippingMethod: 'delivery' | 'pickup'
  onChange: (method: 'delivery' | 'pickup') => void
  disabled?: boolean
}

export default function DeliveryMethod({ shippingMethod, onChange, disabled = false }: DeliveryMethodProps) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-sm border border-[#D5D9D9] shadow-sm">
      <h2 className="text-lg font-bold text-[#0F1111] mb-4">Delivery Method</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Home Delivery */}
        <button
          type="button"
          onClick={() => !disabled && onChange('delivery')}
          disabled={disabled}
          style={{
            border: shippingMethod === 'delivery' ? '2px solid #FF9900' : '2px solid #D5D9D9',
            backgroundColor: shippingMethod === 'delivery' ? '#FFF5E6' : 'white',
            transition: 'all 0.15s ease'
          }}
          className="w-full text-left flex items-center p-4 rounded-sm hover:border-[#FF9900] focus:outline-none"
        >
          <div className="flex items-center gap-3 w-full">
            <div
              style={{
                backgroundColor: shippingMethod === 'delivery' ? '#FF9900' : '#F3F4F6',
                color: shippingMethod === 'delivery' ? 'white' : '#6B7280'
              }}
              className="p-1.5 rounded-sm transition-colors"
            >
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-gray-900">Home Delivery</span>
              <p className="text-xs text-gray-600 mt-0.5">Fast delivery to your location</p>
            </div>
            {shippingMethod === 'delivery' && (
              <div className="w-5 h-5 rounded-full bg-[#FF9900] flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </button>

        {/* Store Pickup */}
        <button
          type="button"
          onClick={() => !disabled && onChange('pickup')}
          disabled={disabled}
          style={{
            border: shippingMethod === 'pickup' ? '2px solid #FF9900' : '2px solid #D5D9D9',
            backgroundColor: shippingMethod === 'pickup' ? '#FFF5E6' : 'white',
            transition: 'all 0.15s ease'
          }}
          className="w-full text-left flex items-center p-4 rounded-sm hover:border-[#FF9900] focus:outline-none"
        >
          <div className="flex items-center gap-3 w-full">
            <div
              style={{
                backgroundColor: shippingMethod === 'pickup' ? '#FF9900' : '#F3F4F6',
                color: shippingMethod === 'pickup' ? 'white' : '#6B7280'
              }}
              className="p-1.5 rounded-sm transition-colors"
            >
              <Store className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-gray-900">Store Pickup</span>
              <p className="text-xs text-green-700 font-bold mt-0.5">Free</p>
            </div>
            {shippingMethod === 'pickup' && (
              <div className="w-5 h-5 rounded-full bg-[#FF9900] flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}