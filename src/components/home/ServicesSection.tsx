// src/components/home/ServicesSection.tsx

'use client'

import Link from 'next/link'
import { Sparkles, Calendar, HeartHandshake } from 'lucide-react'

export default function ServicesSection() {
  const studioServices = [
    {
      icon: Sparkles,
      title: 'Bridal mehendi designs',
      desc: 'Bespoke custom layouts tailored intricately for fine line detailing and long lasting dark mahogany stains.',
    },
    {
      icon: Calendar,
      title: 'Event party bookings',
      desc: 'Full studio scheduling for festivals, guest gatherings, and professional group application sessions.',
    },
    {
      icon: HeartHandshake,
      title: 'Artist consultations',
      desc: 'One-on-one mix mastery advice focused on raw material triple-sifting and cold storage preservation guidelines.',
    }
  ]

  return (
    <div className="w-full bg-white py-6 px-1 select-none font-sans text-left">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight">
          Our Services
        </h2>
        <Link 
          href="/services" 
          className="text-[14px] font-normal text-blue-600 hover:text-blue-700 transition-colors tracking-tight"
        >
          All services
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {studioServices.map((service, index) => {
          const Icon = service.icon
          return (
            <div key={index} className="flex flex-col gap-3 group">
              <div className="w-12 h-12 rounded-full bg-stone-50/60 flex items-center justify-center text-gray-500 border border-gray-100/80 group-hover:bg-white group-hover:border-gray-300 transition-colors duration-300">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[15px] sm:text-[16px] font-medium text-gray-950 capitalize">
                  {service.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-500 font-normal leading-relaxed">
                  {service.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}