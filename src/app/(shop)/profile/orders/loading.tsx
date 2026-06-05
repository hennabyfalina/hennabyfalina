// src/app/(shop)/profile/orders/loading.tsx

import Container from '@/components/ui/Container'

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 animate-pulse">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />

        {/* Page title skeleton */}
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />

        {/* Filter tabs skeleton */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 mb-6 gap-6 pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full whitespace-nowrap" />
          ))}
        </div>

        {/* Order cards skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((card) => (
            <div key={card} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              {/* Order header */}
              <div className="bg-[#F0F2F2] px-4 md:px-5 py-3 border-b border-gray-300">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 md:gap-12">
                  <div>
                    <div className="h-3 w-20 bg-gray-300 rounded mb-1" />
                    <div className="h-4 w-24 bg-gray-300 rounded" />
                  </div>
                  <div>
                    <div className="h-3 w-12 bg-gray-300 rounded mb-1" />
                    <div className="h-4 w-16 bg-gray-300 rounded" />
                  </div>
                  <div>
                    <div className="h-3 w-16 bg-gray-300 rounded mb-1" />
                    <div className="h-4 w-28 bg-gray-300 rounded" />
                  </div>
                </div>
                <div className="border-t border-gray-200 sm:border-0 pt-2 sm:pt-0 mt-2">
                  <div className="h-3 w-24 bg-gray-300 rounded mb-1" />
                  <div className="h-4 w-32 bg-gray-300 rounded mt-1" />
                </div>
              </div>

              {/* Order body */}
              <div className="p-4 md:p-5 bg-white">
                {/* Status bar */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-32 bg-gray-200 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>

                {/* Product row */}
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                    {/* Image placeholder */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 border border-gray-200 rounded-sm" />
                    {/* Product details */}
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 bg-gray-200 rounded" />
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-5 w-24 bg-gray-200 rounded" />
                      <div className="h-4 w-56 bg-gray-200 rounded" />
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="mt-2 md:mt-0 flex flex-col gap-2 w-full md:w-56 shrink-0">
                    <div className="h-10 bg-gray-200 rounded-xl" />
                    <div className="h-10 bg-gray-200 rounded-xl" />
                    <div className="h-10 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}