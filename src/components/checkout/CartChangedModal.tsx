// src/components/checkout/CartChangedModal.tsx

'use client'

import { ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CartChangedModalProps {
  isOpen: boolean
  onClose: () => void
  onReturnToCart: () => void
}

export default function CartChangedModal({ isOpen, onClose, onReturnToCart }: CartChangedModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#FFF4F4] rounded-full flex items-center justify-center mb-4 border border-[#F2B8B5]">
            <ShoppingCart className="w-6 h-6 text-[#B3261E]" />
          </div>
          <h3 className="text-lg font-bold text-[#0F1111] mb-2">Cart Updated Externally</h3>
          <p className="text-sm text-gray-600 mb-6">
            We noticed your cart contents changed in another tab or window. Please review your cart to ensure your order is correct before paying.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onReturnToCart}
              className="w-full px-4 py-2 text-sm font-medium text-[#0F1111] bg-white border border-[#D5D9D9] hover:bg-gray-50 rounded-sm shadow-sm transition-colors cursor-pointer"
            >
              Yes, Return to Cart
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-bold text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-colors cursor-pointer"
            >
              Stay in Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}