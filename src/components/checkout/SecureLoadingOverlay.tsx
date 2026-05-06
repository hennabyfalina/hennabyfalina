// src/components/checkout/SecureLoadingOverlay.tsx

'use client'

import { useEffect } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'

interface SecureLoadingOverlayProps {
  isProcessing: boolean
}

export default function SecureLoadingOverlay({ isProcessing }: SecureLoadingOverlayProps) {
  // Lock scrolling when the overlay is active
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white animate-in fade-in duration-300">
      <div className="bg-white p-8 md:p-12 max-w-md w-full text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock className="w-8 h-8 text-[#007185] animate-pulse" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0F1111] mb-2 tracking-tight">Establishing Secure Connection</h2>
        <p className="text-gray-600 mb-8 font-medium text-sm">Please wait while we secure your order...</p>
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 border-4 border-[#007185]/30 border-t-[#007185] rounded-full animate-spin"></div>
        </div>
        <div className="bg-gray-50 rounded-md p-4 flex items-center justify-center gap-2 text-sm text-gray-700 border border-gray-200 w-full">
          
          <span className="font-medium text-left leading-tight">Please do not refresh, go back, or close this window.</span>
        </div>
      </div>
    </div>
  )
}