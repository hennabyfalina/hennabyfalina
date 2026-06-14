// src/app/(shop)/products/loading.tsx

export default function ProductsLoading() {
  return (
    <div className="w-full min-h-screen bg-white pb-24 select-none font-sans antialiased animate-fade-in">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full flex flex-col gap-6 pt-6">
        
        {/* 🚀 1. Centered Title Track & Breadcrumb Skeleton */}
        <div className="w-full flex flex-col items-center justify-center text-center gap-3 pt-6 pb-2">
          {/* Breadcrumbs label stream */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="h-3.5 bg-stone-100 rounded-md w-12 animate-pulse" />
            <span className="text-stone-200">/</span>
            <div className="h-3.5 bg-stone-100 rounded-md w-16 animate-pulse" />
            <span className="text-stone-200">/</span>
            <div className="h-3.5 bg-stone-100/80 rounded-md w-24 animate-pulse" />
          </div>
          
          {/* Main title layout banner block */}
          <div className="h-8 sm:h-10 bg-stone-100 rounded-md w-48 sm:w-64 mt-1 animate-pulse" />
        </div>

        {/* 🚀 2. Action Strip Control Row (Filter & Sort Capsules) */}
        <div className="w-full flex items-center justify-between border-b border-gray-50 py-3 px-1 mb-2">
          {/* Filter toggle button pill */}
          <div className="h-10 w-24 bg-stone-50 rounded-full border border-gray-100 animate-pulse" />
          {/* Sort selection dropdown pill */}
          <div className="h-10 w-36 bg-stone-50 rounded-full border border-gray-100 animate-pulse" />
        </div>

        {/* 🚀 3. Core Storefront Grid Display Area (Locked 2-mobile, 4-desktop) */}
        <div className="w-full">
          <div className="grid gap-x-4 gap-y-8 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 w-full group">
                
                {/* Visual Image Asset Block with identical border proportions */}
                <div className="relative aspect-square w-full bg-stone-50/60 rounded-xl border border-gray-100/40 animate-pulse" />
                
                {/* Typography metadata lines */}
                <div className="px-1 space-y-2">
                  {/* Product heading label line */}
                  <div className="h-4 bg-stone-50/80 rounded-md w-11/12 animate-pulse" />
                  
                  {/* Price / variant tag lines */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="h-4 bg-stone-50 rounded-md w-16 animate-pulse" />
                    <div className="h-3.5 bg-stone-50/40 rounded-md w-10 animate-pulse" />
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