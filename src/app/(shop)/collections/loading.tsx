// src/app/(shop)/collections/loading.tsx

import Container from '@/components/ui/Container'

export default function CollectionsLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-16 animate-pulse select-none text-left">
      <Container className="max-w-[1200px] px-4 sm:px-8">
        
        {/* Left-Aligned Breadcrumb Line Skeleton */}
        <div className="h-4 w-44 bg-stone-100 rounded-md mb-4" />

        {/* Centered Heading Descriptor Block Skeletons */}
        <div className="mb-12 border-b border-stone-100 pb-8 space-y-3 flex flex-col items-center">
          <div className="h-10 w-56 bg-stone-100 rounded-lg" />
          <div className="space-y-1.5 w-full flex flex-col items-center">
            <div className="h-4 w-full max-w-xl bg-stone-100 rounded-md mx-auto" />
            <div className="h-4 w-full max-w-md bg-stone-100 rounded-md mx-auto" />
          </div>
        </div>

        {/* Master Lookbook Cards Grid Skeleton Workspace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {[1, 2, 3, 4, 5, 6].map((skeleton) => (
            <div key={skeleton} className="flex flex-col w-full">
              
              {/* Aspect [4/5] Rounded Banner Placeholder Block */}
              <div className="w-full aspect-[4/5] bg-stone-50 border border-stone-100 rounded-3xl mb-4" />

              {/* Typography Sub-lines Details Base Grid Placeholders */}
              <div className="px-1 flex items-start justify-between gap-4 w-full">
                <div className="space-y-2 flex-1 pt-0.5">
                  <div className="h-4.5 w-36 bg-stone-100 rounded-md" />
                  <div className="h-3.5 w-full max-w-[200px] bg-stone-100 rounded-md" />
                </div>
                
                {/* Round Link Circle Icon Skeleton Frame */}
                <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 shrink-0" />
              </div>

            </div>
          ))}
        </div>

      </Container>
    </div>
  )
}