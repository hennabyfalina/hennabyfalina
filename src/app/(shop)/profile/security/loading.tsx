// src/app/(shop)/profile/security/loading.tsx

import Container from '@/components/ui/Container'

export default function SecurityLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-14 animate-pulse select-none">
      <Container className="max-w-[800px] px-4 sm:px-8">
        
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-44 bg-stone-100 rounded-md mb-5" />

        {/* Header with title and badge skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="h-8 w-52 bg-stone-100 rounded-lg" />
          <div className="h-6 w-32 bg-stone-100 rounded-full" />
        </div>

        {/* Settings panel wireframe canvas */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
          
          {/* Name Row */}
          <div className="p-5 flex justify-between items-center border-b border-gray-100">
            <div className="space-y-2">
              <div className="h-4 w-12 bg-stone-100 rounded-md" />
              <div className="h-5 w-40 bg-stone-100 rounded-md" />
            </div>
            <div className="h-4 w-20 bg-stone-100 rounded-md" />
          </div>

          {/* Email Row */}
          <div className="p-5 flex justify-between items-center border-b border-gray-100">
            <div className="space-y-2">
              <div className="h-4 w-12 bg-stone-100 rounded-md" />
              <div className="h-5 w-56 bg-stone-100 rounded-md" />
            </div>
            <div className="h-4 w-24 bg-stone-100 rounded-md" />
          </div>

          {/* Phone Row */}
          <div className="p-5 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 w-44 bg-stone-100 rounded-md" />
              <div className="h-5 w-36 bg-stone-100 rounded-md" />
              <div className="h-3.5 w-52 bg-stone-100 rounded-md pt-1" />
            </div>
            <div className="h-4 w-16 bg-stone-100 rounded-md" />
          </div>

        </div>
      </Container>
    </div>
  )
}