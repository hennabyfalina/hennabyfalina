// src/app/(shop)/product/[slug]/loading.tsx

export default function ProductDetailsLoading() {
  return (
    <div className="w-full min-h-screen bg-white pb-24 md:pb-32 select-none font-sans antialiased animate-fade-in" suppressHydrationWarning>
      
      {/* Outer Content Container - Matches max-w-[1100px] constraints exactly */}
      <div className="pt-20 pb-6 md:pt-10 max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col gap-8 w-full">
        
        {/* 🚀 1. Desktop Minimal Breadcrumbs Line Fallback */}
        <nav className="hidden md:flex items-center gap-2">
          <div className="h-3.5 bg-stone-100 rounded-md w-12 animate-pulse" />
          <span className="text-stone-200 text-xs">/</span>
          <div className="h-3.5 bg-stone-100 rounded-md w-16 animate-pulse" />
          <span className="text-stone-200 text-xs">/</span>
          <div className="h-3.5 bg-stone-50/80 rounded-md w-32 animate-pulse" />
        </nav>

        {/* 🚀 2. Balanced Split Layout Media & Selection Information Workspace */}
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start w-full">
          
          {/* Left Side: Large Media Canvas Frame Placeholder (Aspect Square) */}
          <div className="w-full md:w-1/2">
            <div className="aspect-square w-full bg-stone-50/60 rounded-2xl border border-gray-100/40 animate-pulse" />
          </div>

          {/* Right Side: Fluid Interactive Parameter Content Line Tiers */}
          <div className="w-full md:w-1/2 space-y-6 pt-1">
            
            {/* Category title badge + main naming line header track */}
            <div className="space-y-3">
              <div className="h-3.5 bg-stone-50 rounded-md w-24 animate-pulse" />
              <div className="h-7 sm:h-9 bg-stone-100 rounded-md w-4/5 animate-pulse" />
            </div>

            {/* Price mapping section capsule */}
            <div className="flex items-baseline gap-2 pt-1 border-b border-gray-50 pb-5">
              <div className="h-6 bg-stone-100 rounded-md w-28 animate-pulse" />
              <div className="h-4 bg-stone-50 rounded-md w-14 animate-pulse" />
            </div>

            {/* Quantity Selector Option Tiers placeholders */}
            <div className="space-y-3 pt-2">
              <div className="h-4 bg-stone-50/80 rounded-md w-1/4 username-pulse" />
              <div className="flex gap-2.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="w-12 h-9 rounded-xl bg-stone-50/40 border border-gray-100/60 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Core Action call tracking buttons array */}
            <div className="space-y-3 pt-4">
              <div className="w-full h-12 rounded-xl bg-stone-950/5 animate-pulse" />
              <div className="w-full h-11 rounded-xl bg-stone-50/60 border border-gray-100/80 animate-pulse" />
            </div>

            {/* Description lines stream block */}
            <div className="space-y-2 pt-4">
              <div className="h-3.5 bg-stone-50/80 rounded-md w-full animate-pulse" />
              <div className="h-3.5 bg-stone-50/80 rounded-md w-11/12 animate-pulse" />
              <div className="h-3.5 bg-stone-50/50 rounded-md w-4/5 animate-pulse" />
            </div>

          </div>
        </div>

        {/* 🚀 3. Frequently Bought Together Bundle Placeholder */}
        <div className="mt-8 pt-6 border-t border-gray-100/70 w-full">
          {/* Centered sectional headline anchor line */}
          <div className="w-full flex flex-col items-center justify-center gap-2 mb-6">
            <div className="h-5 bg-stone-100 rounded-md w-48 animate-pulse" />
            <div className="h-3.5 bg-stone-50/60 rounded-md w-64 animate-pulse" />
          </div>
          {/* Open list horizontal strip fallback */}
          <div className="w-full h-24 rounded-2xl bg-stone-50/40 border border-gray-100/50 animate-pulse" />
        </div>

        {/* 🚀 4. Infinite Related Products Swiper Deck Placeholder */}
        <div className="mt-4 w-full">
          <div className="h-5 bg-stone-100 rounded-md w-36 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-3 hidden last:block sm:block">
                <div className="aspect-square bg-stone-50/60 rounded-xl border border-gray-100/40 animate-pulse" />
                <div className="h-3.5 bg-stone-50 rounded-md w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}