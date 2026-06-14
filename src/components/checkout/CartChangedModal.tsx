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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 border border-gray-50 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-5">
            <ShoppingCart className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>
          
          <h3 className="text-[18px] font-semibold text-gray-900 mb-2 tracking-tight">Cart Changed</h3>
          <p className="text-[14px] text-gray-500 font-normal mb-8 leading-relaxed">
            Your cart was updated in another window. Please review your items to continue.
          </p>
          
          <div className="flex flex-col w-full gap-2.5">
            <button
              onClick={onReturnToCart}
              className="w-full h-12 flex items-center justify-center text-[14px] font-medium text-white bg-black hover:bg-stone-900 rounded-xl transition-all cursor-pointer shadow-none"
            >
              Review Cart
            </button>
            <button
              onClick={onClose}
              className="w-full h-12 flex items-center justify-center text-[14px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 rounded-xl transition-all cursor-pointer shadow-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}