// src/components/home/WhyChooseUsSection.tsx

'use client'

import { ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function WhyChooseUsSection() {
  const features = [
    { icon: ShieldCheck, title: 'Premium Quality', desc: 'Industry standard materials' },
    { icon: Truck, title: 'Fast Delivery', desc: 'Secure Pan-India logistics' },
    { icon: CreditCard, title: 'Secure Payment', desc: '100% protected transactions' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '7-day replacement policy' },
  ]

  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)]" suppressHydrationWarning>
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6">Why shop with {siteConfig.shortName}?</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6" suppressHydrationWarning>
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <div key={idx} className="flex flex-col items-center text-center p-3" suppressHydrationWarning>
              <div className="w-15 h-15 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100" suppressHydrationWarning>
                <Icon className="w-6 h-6 text-[#007185]" />
              </div>
              <h3 className="text-md font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}