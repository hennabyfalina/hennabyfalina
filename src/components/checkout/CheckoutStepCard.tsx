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

export default function CheckoutStepCard({ step, title, children, isActive = true, className = '' }: CheckoutStepCardProps) {
  return (
    <div className={`bg-white rounded-sm border border-[#D5D9D9] p-5 sm:p-6 shadow-sm ${!isActive ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <div className="flex items-center gap-3 mb-6 border-b border-[#D5D9D9] pb-3">
        <span className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-lg ${isActive ? 'bg-[#007185]' : 'bg-gray-400'}`}>
          {step}
        </span>
        <h2 className="text-xl font-bold text-[#0F1111]">{title}</h2>
      </div>
      {children}
    </div>
  )
}