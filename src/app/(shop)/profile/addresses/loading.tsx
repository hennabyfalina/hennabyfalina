// src/app/(shop)/profile/addresses/loading.tsx

import Container from '@/components/ui/Container'

export default function AddressesLoading() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 animate-pulse">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />

        {/* Page title skeleton */}
        <div className="h-8 w-40 bg-gray-200 rounded mb-6" />

        {/* Address cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Address card skeleton */}
          <div className="h-[280px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-2" />
            <div className="h-6 w-28 bg-gray-200 rounded" />
          </div>

          {/* Existing address cards skeletons */}
          {[1, 2].map((i) => (
            <div key={i} className="h-[280px] border border-gray-300 rounded-lg p-5 flex flex-col shadow-sm bg-white">
              {/* Primary/Secondary badge */}
              <div className="h-4 w-28 bg-gray-200 rounded mb-2 pb-2" />
              
              {/* Address content */}
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded mt-2" />
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                <div className="h-4 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}