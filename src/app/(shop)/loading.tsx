// src/app/(shop)/loading.tsx

import { siteConfig } from '@/config/site'

export default function ShopLoading() {
  return (
    <div className="flex-1 flex flex-col w-full bg-white pb-16 select-none font-sans antialiased animate-fade-in">
      
      {/* 🚀 Hero Banner Placeholder Canvas */}
      <div className="w-full max-w-[1600px] mx-auto relative px-4 sm:px-8 pt-4">
        <div className="w-full h-[200px] sm:h-[380px] md:h-[480px] bg-stone-100/60 rounded-xl animate-pulse" />
        
        {/* Continuous Single Stream Layout Stack Container */}
        <div className="relative z-10 mt-10 space-y-12 max-w-[1400px] mx-auto w-full">
          
          {/* Block 2: Visual Mini-Navigation Bubbles (CategorySection) */}
          <div className="py-2">
            <div className="flex justify-between items-baseline mb-6">
              <div className="h-7 bg-stone-100/80 rounded-md w-48 animate-pulse" />
              <div className="h-5 bg-stone-100/60 rounded-md w-16 animate-pulse" />
            </div>
            <div className="flex gap-6 sm:gap-10 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
                  <div className="w-[70px] h-[70px] sm:w-[86px] sm:h-[86px] rounded-full bg-stone-50/60 border border-gray-100/60 animate-pulse" />
                  <div className="h-4 bg-stone-50/80 rounded-md w-16 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Block 3: Returning Shopper Personalization Shelf (RecentlyBoughtCarousel) */}
          <div className="py-4">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-2">
                <div className="h-6 bg-stone-100/80 rounded-md w-40 animate-pulse" />
                <div className="h-3 bg-stone-50/60 rounded-md w-64 animate-pulse" />
              </div>
              <div className="h-10 bg-stone-100/80 rounded-md w-32 animate-pulse" />
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[200px] sm:w-[240px] h-[320px] bg-stone-50/30 rounded-2xl animate-pulse shrink-0 border border-stone-100/50" />
              ))}
            </div>
          </div>

          {/* Block 4: Featured Products Shelf (FeaturedProductsSection) */}
          <div className="py-4 px-1">
            <div className="flex justify-between items-baseline mb-6">
              <div className="h-7 bg-stone-100/80 rounded-md w-56 animate-pulse" />
              <div className="h-5 bg-stone-100/60 rounded-md w-16 animate-pulse" />
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[200px] sm:w-[260px] flex-shrink-0 space-y-3">
                  <div className="aspect-square bg-stone-50/60 rounded-xl animate-pulse" />
                  <div className="h-4 bg-stone-50/80 rounded-md w-3/4 animate-pulse" />
                  <div className="h-4 bg-stone-50/50 rounded-md w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Block 2.5: Curated Design Portfolios (DesignCollectionsSection) */}
          <div className="py-2 px-1">
            <div className="flex justify-between items-baseline mb-6">
              <div className="h-7 bg-stone-100/80 rounded-md w-40 animate-pulse" />
              <div className="h-4 bg-stone-100/60 rounded-md w-14 animate-pulse" />
            </div>
            <div className="flex gap-5 sm:gap-8 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
                  <div className="w-[70px] h-[70px] sm:w-[86px] sm:h-[86px] rounded-full bg-stone-50/40 border border-gray-100/50 animate-pulse" />
                  <div className="h-3.5 bg-stone-50/60 rounded-md w-20 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Block 2.6: Bespoke Studio Services (ServicesSection) */}
          <div className="py-4 px-1">
            <div className="flex justify-between items-baseline mb-6">
              <div className="h-7 bg-stone-100/80 rounded-md w-44 animate-pulse" />
              <div className="h-4 bg-stone-100/60 rounded-md w-14 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-full bg-stone-50/60 border border-gray-100/50 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-stone-100/80 rounded-md w-1/2 animate-pulse" />
                    <div className="h-3.5 bg-stone-50/60 rounded-md w-11/12 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 5: Core Value Pillars (WhyChooseUsSection) */}
          <div className="py-6 px-1 border-t border-gray-100/70">
            <div className="h-7 bg-stone-100/80 rounded-md w-64 mb-8 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-start gap-3 text-left">
                  <div className="w-12 h-12 bg-stone-50/60 rounded-full animate-pulse border border-gray-100/50" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-stone-100/70 rounded-md w-2/3 animate-pulse" />
                    <div className="h-3.5 bg-stone-50/60 rounded-md w-11/12 animate-pulse" />
                    <div className="h-3.5 bg-stone-50/40 rounded-md w-3/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 6: Social Proof (TestimonialsSection) */}
          <div className="py-6 px-1 border-t border-gray-100/70">
            <div className="h-7 bg-stone-100/80 rounded-md w-60 mb-8 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4 text-left">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="w-4 h-4 bg-amber-500/10 rounded-full animate-pulse" />
                    ))}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-stone-50/80 rounded-md w-full animate-pulse" />
                    <div className="h-4 bg-stone-50/80 rounded-md w-11/12 animate-pulse" />
                    <div className="h-4 bg-stone-50/50 rounded-md w-5/6 animate-pulse" />
                  </div>
                  <div className="pt-4 border-t border-gray-100/60 mt-2 space-y-1.5">
                    <div className="h-4 bg-stone-100/70 rounded-md w-28 animate-pulse" />
                    <div className="h-3.5 bg-stone-50/50 rounded-md w-40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 7: Clean Connect Footer Area (ContactSection) */}
          <div className="py-6 px-1 border-t border-gray-100/70">
            <div className="h-7 bg-stone-100/80 rounded-md w-52 mb-8 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="md:col-span-5 space-y-4">
                <div className="h-4 bg-stone-50/80 rounded-md w-full animate-pulse" />
                <div className="h-4 bg-stone-50/80 rounded-md w-5/6 animate-pulse" />
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-stone-50/60 animate-pulse" /><div className="h-4 bg-stone-50 rounded-md w-32 animate-pulse" /></div>
                  <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-stone-50/60 animate-pulse" /><div className="h-4 bg-stone-50 rounded-md w-44 animate-pulse" /></div>
                </div>
              </div>
              <div className="md:col-span-7 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-11 bg-transparent border-b border-gray-100 w-full animate-pulse" />
                  <div className="h-11 bg-transparent border-b border-gray-100 w-full animate-pulse" />
                </div>
                <div className="h-12 bg-transparent border-b border-gray-100 w-full animate-pulse" />
                <div className="h-10 bg-stone-950/10 rounded-xl w-32 animate-pulse mt-4" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}