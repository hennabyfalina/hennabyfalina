// src/components/checkout/CheckoutStepCard.tsx

'use client'

import { ReactNode } from 'react'

interface CheckoutStepCardProps {
  step: number
  title: string
  children: ReactNode
  isActive?: boolean
  className?: string
}

export default function CheckoutStepCard({ 
  step, 
  title, 
  children, 
  isActive = true, 
  className = '' 
}: CheckoutStepCardProps) {
  return (
    <div 
      className={`w-full bg-white transition-opacity duration-200 select-none font-sans antialiased text-left ${
        !isActive ? 'opacity-30 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Step Header Block - Flat Seamless Document Flow */}
      <div className="flex items-center gap-3 mb-6">        
        <h2 className="text-[27px] font-normal tracking-tight text-gray-900 capitalize">
          {title}
        </h2>
      </div>

      {/* Embedded Context Step Fields */}
      <div className="w-full px-0.5">
        {children}
      </div>
    </div>
  )
}