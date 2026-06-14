// src/components/cart/CartAlertsModal.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, X } from 'lucide-react'

interface CartAlertsModalProps {
  alerts: string[] | null
  onDismiss: () => void
}

export default function CartAlertsModal({ alerts, onDismiss }: CartAlertsModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasAlerts = alerts && alerts.length > 0

  useEffect(() => {
    if (hasAlerts) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [hasAlerts])

  if (!hasAlerts || !mounted) return null

  return createPortal(
    <div className="z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fixed inset-0" style={{ height: '100dvh' }}>
      <div className="absolute inset-0" onClick={onDismiss} style={{ touchAction: 'none' }} />
      
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-50 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center p-6 sm:p-8">
          <button 
            onClick={onDismiss} 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors cursor-pointer outline-none" 
            aria-label="Close modal dialog"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
          
          <div className="w-12 h-12 bg-stone-50 text-gray-900 rounded-full flex items-center justify-center mb-5">
            <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
          </div>
          
          <h3 className="text-[18px] font-semibold text-gray-900 mb-2 tracking-tight">Cart Updated</h3>
          <p className="text-[14px] text-gray-500 font-normal mb-6">Some items in your cart required adjustments.</p>
          
          <div className="text-[14px] mb-8 w-full text-left bg-gray-50/50 p-4 rounded-xl border border-gray-100 max-h-[25vh] overflow-y-auto no-scrollbar">
            <ul className="space-y-3">
              {alerts!.map((alert, i) => (
                <li key={i} className="text-gray-600 font-normal leading-relaxed flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-2" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={onDismiss} 
            className="w-full h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[14px] font-medium transition-all shadow-none cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}