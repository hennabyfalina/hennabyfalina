// src/components/product/TrustBadges.tsx

'use client'

import { ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react'

export default function TrustBadges() {
  const badges = [
    { icon: CreditCard, text: 'Secure Checkout', description: 'UPI & Card Encrypted', colorClass: 'text-stone-900' },
    { icon: Truck, text: 'Fresh Dispatch', description: 'Shipped within 24-48 Hours', colorClass: 'text-stone-900' },
    { icon: RotateCcw, text: 'Safety Replaced', description: 'Transit protection policy', colorClass: 'text-stone-900' },
    { icon: ShieldCheck, text: '100% Organic', description: 'Chemical & PPD-Free', colorClass: 'text-stone-900' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-gray-100">
      {badges.map((badge, idx) => {
        const Icon = badge.icon
        return (
          <div 
            key={idx} 
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 group select-none"
          >
            <div className={`p-2.5 rounded-full bg-stone-50 group-hover:bg-white group-hover:ring-1 group-hover:ring-gray-200 transition-all duration-300 mb-3 ${badge.colorClass}`}>
              <Icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            
            <p className="text-[13px] font-bold tracking-wide text-gray-900 mb-1">
              {badge.text}
            </p>
            <p className="text-[11px] text-gray-400 font-medium leading-normal max-w-[130px]">
              {badge.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}