// src/components/checkout/SessionExpiredModal.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, X } from 'lucide-react'

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
    <div className="z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fixed inset-0" style={{ height: '100dvh' }}>
      <div className="absolute inset-0" style={{ touchAction: 'none' }} />
      
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-50 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors cursor-pointer outline-none" aria-label="Close session notice dialog">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
          
          <div className="w-12 h-12 bg-stone-50 text-gray-900 rounded-full flex items-center justify-center mb-5">
            <Clock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          
          <h3 className="text-[18px] font-semibold text-gray-900 mb-2 tracking-tight">Session Expired</h3>
          
          <p className="text-[14px] text-gray-500 font-normal mb-8 leading-relaxed">
            Your 15-minute reservation window has ended. Please return to your cart to secure your items again.
          </p>
          
          <button onClick={onClose} className="w-full h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[14px] font-medium transition-all shadow-none cursor-pointer">
            Return to Cart
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}