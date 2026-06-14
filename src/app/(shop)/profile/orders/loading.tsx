// src/app/(shop)/profile/orders/loading.tsx

import Container from '@/components/ui/Container'

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-16 animate-pulse select-none text-left">
      <Container className="max-w-[1100px] px-4 sm:px-8">
        
        {/* Left-Aligned Breadcrumb Skeleton */}
        <div className="h-4 w-44 bg-stone-100 rounded-md mb-4" />

        {/* Left-Aligned Header Title Stack Skeletons */}
        <div className="mb-10 space-y-2.5">
          <div className="h-9 w-48 bg-stone-100 rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-stone-100 rounded-md" />
        </div>

        {/* Filter Navigation Tabs Row Skeleton (Left-Aligned Canvas Strip Layout) */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 mb-12 gap-7 pb-3">
          {[1, 2, 3, 4, 5].map((tab) => (
            <div key={tab} className="h-4 w-20 bg-stone-100 rounded-md shrink-0" />
          ))}
        </div>

        {/* 🚀 FIXED: Rebuilt Timeline Loop to match the Apple-inspired borderless layout exactly */}
        <div className="space-y-16">
          {[1, 2, 3].map((order) => (
            <div key={order} className="border-b border-stone-100 pb-12 last:border-0 last:pb-0 flex flex-col w-full">
              
              {/* Top Typographic Row Skeleton (Replaces legacy hard header blocks) */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 w-full">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 w-full sm:w-auto">
                  <div className="h-4 w-32 bg-stone-100 rounded-md" />
                  <div className="h-4 w-24 bg-stone-100 rounded-md" />
                  <div className="h-4 w-40 bg-stone-100 rounded-md" />
                  <div className="h-4 w-20 bg-stone-100 rounded-md" />
                </div>
                <div className="h-4 w-36 bg-stone-100 rounded-md shrink-0 hidden sm:block" />
              </div>

              {/* Status Indicator Banner Layer Skeleton */}
              <div className="h-11 w-full bg-stone-50/60 border border-stone-100/40 rounded-2xl mb-6 flex items-center px-4" />

              {/* Core Item Information Split Grid Row Skeleton */}
              <div className="flex flex-col sm:flex-row gap-6 items-start justify-between w-full">
                
                {/* Left Area: Product Image Block & Text Parameter Column Skeletons */}
                <div className="flex gap-5 flex-1 min-w-0 w-full">
                  {/* Premium Bounding Image Container Box Frame */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-stone-50 border border-stone-100 rounded-2xl shrink-0" />
                  
                  {/* Text Line Placeholders */}
                  <div className="flex-1 space-y-3 pt-0.5">
                    <div className="h-4.5 w-full max-w-md bg-stone-100 rounded-md" />
                    <div className="h-4 w-24 bg-stone-100 rounded-md" />
                    <div className="h-4 w-36 bg-stone-100 rounded-md pt-1" />
                  </div>
                </div>

                {/* Right Area: Minimal Monochrome Pill Button Action Column Skeletons */}
                <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-48 shrink-0 pt-0.5">
                  <div className="h-9 bg-stone-50 rounded-xl flex-1 sm:w-full" />
                  <div className="h-9 bg-stone-50 rounded-xl flex-1 sm:w-full" />
                  <div className="h-9 w-9 bg-white border border-stone-200 rounded-xl shrink-0" />
                </div>

              </div>

            </div>
          ))}
        </div>

      </Container>
    </div>
  )
}