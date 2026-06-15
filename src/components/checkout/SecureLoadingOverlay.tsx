// src/components/checkout/SecureLoadingOverlay.tsx

'use client'

import { useEffect } from 'react'

interface SecureLoadingOverlayProps {
  isProcessing: boolean
}

export default function SecureLoadingOverlay({ isProcessing }: SecureLoadingOverlayProps) {
  useEffect(() => {
    if (isProcessing) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isProcessing])

  if (!isProcessing) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Apple-style minimalist spinner: thinner, elegant, precise */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-stone-200 rounded-full" />
          <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>

        {/* Minimalist, high-clarity typography */}
        <div className="text-center space-y-1.5">
          <h2 className="text-[17px] font-semibold text-gray-950 tracking-tight">
            Finalizing your order
          </h2>
          <p className="text-[14px] text-gray-400 font-medium tracking-wide">
            Please stay on this page
          </p>
        </div>
      </div>
    </div>
  )
}