// src/app/(shop)/collections/[slug]/loading.tsx

import Container from '@/components/ui/Container'

export default function CollectionDetailLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-16 animate-pulse select-none text-left">
      <Container className="max-w-[1200px] px-4 sm:px-8">
        
        {/* Left-Aligned Breadcrumb Line Skeleton */}
        <div className="h-4 w-48 bg-stone-100 rounded-md mb-4" />

        {/* Left-Aligned Heading Descriptor Block Skeletons */}
        <div className="mb-12 border-b border-stone-100 pb-8 space-y-3">
          <div className="h-10 w-64 bg-stone-100 rounded-lg" />
          <div className="h-4 w-full max-w-lg bg-stone-100 rounded-md" />
        </div>

        {/* Lookbook Sub-Gallery Grid Placeholder Array */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col w-full">
              
              {/* Aspect [3/4] Staggered Lookbook Photo Holder Skeleton */}
              <div className="w-full aspect-[3/4] bg-stone-50 border border-stone-100 rounded-2xl mb-3" />
              
              {/* Caption Line Placeholders */}
              <div className="space-y-1.5 px-0.5">
                <div className="h-4 w-28 bg-stone-100 rounded-md" />
                <div className="h-3.5 w-16 bg-stone-100 rounded-md" />
              </div>

            </div>
          ))}
        </div>

      </Container>
    </div>
  )
}