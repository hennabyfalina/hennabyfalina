// src/app/(shop)/profile/settings/loading.tsx

import Container from '@/components/ui/Container'

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-14 animate-pulse select-none text-left">
      <Container className="max-w-[800px] px-4 sm:px-8">
        
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-44 bg-stone-100 rounded-md mb-5" />

        {/* Page Title skeleton */}
        <div className="h-8 w-56 bg-stone-100 rounded-lg mb-8" />

        <div className="space-y-8">
          {[1, 2].map((card) => (
            <div key={card} className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
              {/* Card internal group folder title skeleton */}
              <div className="h-5 w-40 bg-stone-100 rounded-md mb-4 pb-2" />
              
              {/* Description body lines skeleton */}
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-stone-100 rounded-md" />
                <div className="h-4 w-5/6 bg-stone-100 rounded-md" />
              </div>
              
              {/* Dynamic control component trigger button skeleton */}
              <div className="h-10 w-36 bg-stone-100 rounded-xl" />
            </div>
          ))}
        </div>

      </Container>
    </div>
  )
}