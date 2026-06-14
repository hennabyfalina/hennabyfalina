// src/components/home/HeroSection.tsx

'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[60vh] sm:min-h-[75vh] bg-white text-gray-900 flex items-center justify-center px-4 sm:px-8 py-12 sm:py-20 overflow-hidden" suppressHydrationWarning>
      
      {/* Background Editorial Canvas Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-30 transition-opacity duration-500">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-stone-50 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-2%] w-[400px] h-[400px] rounded-full bg-stone-50/50 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center text-center">
        {/* Luxury Trust Pillar Accent */}
        <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-transparent text-gray-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-6 animate-fade-in">
          <Sparkles className="w-3 h-3 text-amber-500/60" />
          100% Organic & Chemical-Free
        </div>
        
        {/* Editorial Heading */}
        <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] mb-6 text-gray-900 max-w-3xl normal font-sans">
          Pure Organic <br className="hidden sm:block" />
          <span className="font-bold">Henna</span> <br className="hidden sm:block" />
          <span className="text-gray-400 font-light italic normal-case tracking-normal">
            Crafted for Traditions
          </span>
        </h1>
        
        {/* Clean Subtext description */}
        <p className="text-[14px] md:text-[16px] text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed tracking-wide font-normal">
          Premium triple-sifted powder, fresh bridal cones, and pure essential oils. Freshly batched for flawless consistency.
        </p>
        
        {/* Minimal High-Contrast Conversion Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/products"
            className="w-full sm:w-auto px-10 py-3.5 bg-gray-900 hover:bg-black text-white text-[12px] font-bold tracking-widest normal rounded-full transition-all duration-300 flex items-center justify-center group active:scale-[0.98] cursor-pointer"
          >
            Explore Collection
            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </Link>
          
          <a
            href={`https://wa.me/${siteConfig.contact.phone.primary.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Hello! I'd like to inquire about booking a henna artist for an upcoming event.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-10 py-3.5 bg-stone-50 hover:bg-stone-100 text-gray-900 text-[12px] font-bold tracking-widest normal rounded-full transition-all duration-300 border border-gray-200/50 flex items-center justify-center active:scale-[0.98] cursor-pointer"
          >
            Book an Artist
          </a>
        </div>
      </div>
    </section>
  )
}