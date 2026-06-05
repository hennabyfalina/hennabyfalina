// src/components/cart/CartAlertsModal.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

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
    <div className="z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <div className="absolute inset-0" onClick={onDismiss} style={{ touchAction: 'none' }} />
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center p-6 sm:p-8">
          <button onClick={onDismiss} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-[#ffe5e5] border border-[#fbb4b4] rounded-full flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8 text-[#C7511F]" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">Please review your cart</h3>
          
          <div className="text-sm mb-8 w-full text-left bg-[#FFF4E5]/40 p-4 rounded-sm border border-[#FBD8B4] shadow-inner max-h-[30vh] overflow-y-auto no-scrollbar">
            <ul className="list-disc pl-4 space-y-2">
              {alerts!.map((alert, i) => (
                <li key={i} className="text-gray-800 leading-snug">{alert}</li>
              ))}
            </ul>
          </div>
          
          <button onClick={onDismiss} className="w-full px-8 py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors shadow-sm focus:ring-2 focus:ring-[#007185] cursor-pointer">
            Dismiss Alerts
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}