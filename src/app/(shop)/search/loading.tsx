// src/app/(shop)/search/loading.tsx

export default function SearchLoading() {
  return (
    <div className="w-full min-h-screen bg-white pb-24 select-none font-sans antialiased animate-fade-in" suppressHydrationWarning>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8 flex flex-col gap-6">
        
        {/* 🚀 1. Flat Un-boxed Heading Skeleton Track */}
        <div className="pb-2">
          {/* Main title text line */}
          <div className="h-7 sm:h-8 bg-stone-100 rounded-md w-56 sm:w-64 animate-pulse" />
          {/* Subtext description line */}
          <div className="h-4 bg-stone-50 rounded-md w-36 sm:w-44 mt-2 animate-pulse" />
        </div>

        {/* 🚀 2. Action Strip Control Row (Filter & Sort Capsule Outlines) */}
        <div className="w-full flex items-center justify-between border-b border-gray-50 py-3 px-1 mb-2">
          {/* Filter toggle capsule outline */}
          <div className="h-10 w-24 bg-stone-50/60 rounded-full border border-gray-100/60 animate-pulse" />
          {/* Sort selection drawer layout outline */}
          <div className="h-10 w-36 bg-stone-50/60 rounded-full border border-gray-100/60 animate-pulse" />
        </div>

        {/* 🚀 3. Core Storefront Grid Display Area (Locked 2-mobile, 4-desktop) */}
        <div className="w-full">
          <div className="grid gap-x-4 gap-y-8 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 w-full">
                
                {/* Visual Image Card Asset Frame Box */}
                <div className="relative aspect-square w-full bg-stone-50/60 rounded-xl border border-gray-100/40 animate-pulse" />
                
                {/* Product Meta Text Content Lines */}
                <div className="px-1 space-y-2">
                  {/* Title label stream placeholder */}
                  <div className="h-4 bg-stone-50/80 rounded-md w-11/12 animate-pulse" />
                  
                  {/* Pricing variation values metadata flags */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="h-4 bg-stone-50 rounded-md w-14 animate-pulse" />
                    <div className="h-3.5 bg-stone-50/40 rounded-md w-8 animate-pulse" />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}