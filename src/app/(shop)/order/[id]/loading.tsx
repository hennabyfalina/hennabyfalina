// src/app/(shop)/order/[id]/loading.tsx

import Container from '@/components/ui/Container'

export default function OrderDetailsLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <Container className="py-8 md:py-12 max-w-4xl">
        {/* Back button skeleton */}
        <div className="mb-6">
          <div className="h-5 w-28 bg-gray-200 rounded" />
        </div>

        {/* Main order card skeleton */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-32 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="hidden sm:block w-px h-4 bg-gray-300" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="h-10 w-28 bg-gray-200 rounded-md" />
              <div className="h-10 w-28 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>

        {/* Tracking timeline skeleton */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="h-7 w-64 bg-gray-200 rounded mb-2" />
          <div className="mt-8 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-column info grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4 pb-3 border-b border-gray-200" />
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order items section skeleton */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2].map((item) => (
              <div key={item} className="p-6 flex flex-col md:flex-row gap-5 items-start">
                <div className="flex gap-5 flex-1 w-full">
                  {/* Image placeholder */}
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-200 rounded-xl border border-gray-200 shrink-0" />
                  
                  {/* Product details */}
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-56 bg-gray-200 rounded" />
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col items-center gap-3 shrink-0 w-full md:w-48">
                  <div className="h-5 w-20 bg-gray-200 rounded" />
                  <div className="h-10 w-full bg-gray-200 rounded-full" />
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}