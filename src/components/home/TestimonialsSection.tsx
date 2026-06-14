// src/components/home/TestimonialsSection.tsx

'use client'

import { Star } from 'lucide-react'
import { siteConfig } from '@/config/site'

const testimonials = [
  {
    name: 'Meera Krishnan',
    role: 'Professional bridal artist',
    content: `The cones from ${siteConfig.shortName.toLowerCase()} flow like absolute butter. There are zero clogs during intricate bridal patterns, and the rich, dark stain development is unmatched.`,
  },
  {
    name: 'Aisha Rahman',
    role: 'Henna enthusiast / customer',
    content: 'Completely chemical-free! I used it for a major family event, and my skin felt perfectly healthy. The organic lavender oils smell incredibly premium.',
  },
  {
    name: 'Kavitha R.',
    role: 'Boutique studio owner',
    content: 'Incredibly consistent batch quality. The triple-sifted henna powder has revolutionized our workshop consistency. Highly recommended.',
  }
]

export default function TestimonialsSection() {
  return (
    <div className="w-full bg-white py-6 px-1 select-none font-sans" suppressHydrationWarning>
      {/* Clean, lightweight sentence-cased heading header */}
      <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight text-left mb-10">
        Loved by Artists &amp; Enthusiasts
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12" suppressHydrationWarning>
        {testimonials.map((test, idx) => (
          <div key={idx} className="bg-white flex flex-col gap-4 text-left group transition-all" suppressHydrationWarning>
            {/* Fine vector star layout track */}
            <div className="flex text-amber-500 gap-0.5" suppressHydrationWarning>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" strokeWidth={0} />
              ))}
            </div>
            
            <p className="text-[15px] sm:text-[16px] text-gray-600 font-normal leading-relaxed flex-1">
              &quot;{test.content}&quot;
            </p>
            
            <div className="pt-4 border-t border-gray-100 mt-auto flex flex-col gap-0.5">
              <h3 className="text-[16px] font-medium text-gray-950 tracking-normal">
                {test.name}
              </h3>
              <p className="text-[14px] text-gray-400 font-normal">
                {test.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}