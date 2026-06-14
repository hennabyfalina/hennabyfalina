// src/app/(shop)/profile/payments/loading.tsx

import Container from '@/components/ui/Container'

export default function PaymentsLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-14 animate-pulse select-none text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-44 bg-stone-100 rounded-md mb-5" />

        {/* Master Header Title skeleton */}
        <div className="h-8 w-48 bg-stone-100 rounded-lg mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {/* 🚀 FIXED: Rebuilt payment card skeleton architecture to match the new borderless layout */}
            <div className="w-full flex items-start p-6 border border-gray-100 bg-white rounded-2xl">
              <div className="flex items-start gap-4 w-full">
                
                {/* Icon placeholder */}
                <div className="w-10 h-10 bg-stone-100 rounded-xl shrink-0" />
                
                {/* Text content skeletons lines */}
                <div className="flex-1 space-y-2.5 pt-0.5">
                  <div className="h-4.5 w-52 bg-stone-100 rounded-md" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full bg-stone-100 rounded-md" />
                    <div className="h-3.5 w-full bg-stone-100 rounded-md" />
                    <div className="h-3.5 w-4/5 bg-stone-100 rounded-md" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  )
}