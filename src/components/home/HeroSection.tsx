// src/components/home/HeroSection.tsx

'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative w-full bg-white text-gray-900 pt-8 pb-20 sm:pt-16 sm:pb-40 px-4 sm:px-8 flex flex-col items-center text-center overflow-hidden border-b border-gray-200" suppressHydrationWarning>
      {/* Full width background with no gaps */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-gray-50 to-white" suppressHydrationWarning></div>
      
      <div className="relative z-10 max-w-4xl mx-auto w-full" suppressHydrationWarning>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4">
          Premium Packaging <br className="hidden sm:block" /> Solutions for Business
        </h1>
        <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Specialists in Sweet Boxes, Cake Boxes, Gift Boxes, Fancy Boxes & Custom Printing Solutions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4" suppressHydrationWarning>
          <Link
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 text-sm font-bold rounded-sm border border-[#FCD200] shadow-sm transition-colors flex items-center justify-center"
          >
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}