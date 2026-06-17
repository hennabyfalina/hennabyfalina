// src/components/checkout/SecureLoadingOverlay.tsx

'use client'

import { useEffect } from 'react'

interface SecureLoadingOverlayProps {
  isProcessing: boolean
  text?: string
  subText?: string
}

export default function SecureLoadingOverlay({ 
  isProcessing, 
  text = "Finalizing your order", 
  subText = "Please stay on this page" 
}: SecureLoadingOverlayProps) {
  useEffect(() => {
    if (isProcessing) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isProcessing])

  if (!isProcessing) return null

  const bars = Array.from({ length: 12 });

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Authentic iOS Smooth Sequential Fade Spinner */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {bars.map((_, i) => {
            const rotationAngle = i * 30;
            const animationDelay = -1 + (i * 0.083);

            return (
              <div
                key={i}
                className="absolute w-[2.5px] h-[7.5px] bg-gray-900 rounded-full animate-ios-fade"
                style={{
                  transform: `rotate(${rotationAngle}deg) translateY(-10px)`,
                  animationDelay: `${animationDelay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Minimalist, high-clarity typography safely preserved */}
        <div className="text-center space-y-1.5 select-none pointer-events-none">
          <h2 className="text-[17px] font-semibold text-gray-950 tracking-tight">
            {text}
          </h2>
          <p className="text-[14px] text-gray-400 font-medium tracking-wide">
            {subText}
          </p>
        </div>
      </div>
    </div>
  )
}