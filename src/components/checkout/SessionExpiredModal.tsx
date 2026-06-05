// src/components/checkout/SessionExpiredModal.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

interface SessionExpiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SessionExpiredModal({ isOpen, onClose }: SessionExpiredModalProps) {
  const [mounted, setMounted] = useState(false)

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

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <div className="absolute inset-0" style={{ touchAction: 'none' }} />
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">Checkout Session Expired</h3>
          
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            Your checkout session has been inactive for 15 minutes. To ensure fair availability for all customers, the inventory reservation has been released. Please review your cart and proceed to checkout when you are ready.
          </p>
          
          <button onClick={onClose} className="w-full px-8 py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors shadow-sm focus:ring-2 focus:ring-[#007185] cursor-pointer">
            Review Cart
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}