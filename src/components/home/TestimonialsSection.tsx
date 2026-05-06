// src/components/home/TestimonialsSection.tsx

'use client'

import { Star } from 'lucide-react'
import { siteConfig } from '@/config/site'

const testimonials = [
  {
    name: 'Saran Kumar',
    role: 'Leading Enterprises',
    content: `Excellent quality products and reliable delivery. ${siteConfig.shortName} has been our go-to supplier for years.`,
  },
  {
    name: 'Priya',
    role: 'E-commerce Seller',
    content: 'The attention to detail and professional service is outstanding. Their bulk rates are very competitive.',
  },
  {
    name: 'Amit Sharma',
    role: 'Retail Owner',
    content: 'Consistent quality. Their boxes are sturdy and perfectly suited for shipping fragile items.',
  }
]

export default function TestimonialsSection() {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)]" suppressHydrationWarning>
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6">What our business partners say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" suppressHydrationWarning>
        {testimonials.map((test, idx) => (
          <div key={idx} className="bg-gray-50 p-4 border border-gray-100 rounded-sm" suppressHydrationWarning>
            <div className="flex text-[#FFA41C] mb-2" suppressHydrationWarning>
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{test.name}</h3>
            <p className="text-xs text-gray-500 mb-3">{test.role}</p>
            <p className="text-sm text-gray-700 line-clamp-3">"{test.content}"</p>
          </div>
        ))}
      </div>
    </div>
  )
}