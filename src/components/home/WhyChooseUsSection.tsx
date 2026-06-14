// src/components/home/WhyChooseUsSection.tsx

'use client'

import { ShieldCheck, Leaf, Sparkles, Clock } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function WhyChooseUsSection() {
  const features = [
    { 
      icon: Leaf, 
      title: '100% organic', 
      desc: 'Freshly batched with zero PPD or harsh chemical additives.', 
      color: 'text-emerald-800' 
    },
    { 
      icon: Sparkles, 
      title: 'Triple sifted', 
      desc: 'Guaranteed ultra-smooth, completely clog-free cone applications.', 
      color: 'text-amber-800' 
    },
    { 
      icon: ShieldCheck, 
      title: 'Premium stains', 
      desc: 'Deep, dark maroon results tested meticulously for skin safety.', 
      color: 'text-stone-700' 
    },
    { 
      icon: Clock, 
      title: 'Freshly dispatched', 
      desc: 'Safely formulated, packed, and shipped within 24–48 hours.', 
      color: 'text-gray-600' 
    },
  ]

  return (
    <div className="w-full bg-white py-6 px-1 select-none font-sans" suppressHydrationWarning>
      {/* Clean, sentence-cased un-bolded header section */}
      <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight text-left mb-10">
        Why Choose {siteConfig.shortName}?
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 sm:gap-8">
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <div key={idx} className="flex flex-col items-center text-center group gap-3">
              {/* Ultra-light minimal outline circle indicator */}
              <div className={`w-12 h-12 bg-stone-50/60 rounded-full flex items-center justify-center border border-gray-100/80 group-hover:bg-white group-hover:border-gray-300 transition-colors duration-300 ${feature.color}`}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5 flex flex-col items-center">
                <h3 className="text-[15px] sm:text-[16px] font-medium text-gray-950 tracking-normal capitalize">
                  {feature.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-500 font-normal leading-relaxed max-w-[160px] sm:max-w-[200px]">
                  {feature.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}