// src/app/(shop)/services/loading.tsx

import Container from '@/components/ui/Container'

export default function ServicesLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-16 animate-pulse select-none text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Breadcrumb line placeholder */}
        <div className="h-4 w-40 bg-stone-100 rounded-md mb-4" />

        {/* Section header stack skeletons */}
        <div className="mb-14 border-b border-stone-100 pb-8 space-y-3">
          <div className="h-10 w-52 bg-stone-100 rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-stone-100 rounded-md" />
        </div>

        {/* Structural items list column stack skeletons */}
        <div className="space-y-20">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-between border-b border-stone-100 pb-16 last:border-0 last:pb-0 w-full">
              
              {/* Left aspect cover box frame placeholder */}
              <div className="w-full md:w-[380px] aspect-[4/3] bg-stone-50 border border-stone-100 rounded-3xl shrink-0" />
              
              {/* Right text descriptor fields column skeletons */}
              <div className="flex-1 space-y-5 w-full pt-1">
                <div className="space-y-2">
                  <div className="h-3.5 w-24 bg-stone-100 rounded-md" />
                  <div className="h-7 w-64 bg-stone-100 rounded-md" />
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 w-full max-w-md bg-stone-100 rounded-md" />
                  <div className="h-4 w-11/12 max-w-sm bg-stone-100 rounded-md" />
                </div>

                {/* Grid matrix row skeleton */}
                <div className="h-14 w-full max-w-md bg-stone-50/60 border border-stone-100/40 rounded-xl" />

                {/* Primary booking button indicator skeleton */}
                <div className="h-11 w-44 bg-stone-50 rounded-full" />
              </div>

            </div>
          ))}
        </div>

      </Container>
    </div>
  )
}