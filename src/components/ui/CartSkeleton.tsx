// src/components/ui/CartSkeleton.tsx

export default function CartSkeleton() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 select-none">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start pt-2">
          
          {/* LEFT COLUMN: CART ITEMS SKELETON – borderless, clean */}
          <div className="lg:col-span-8 flex flex-col">
            
            {/* Header skeleton */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-2">
              <div className="flex items-baseline gap-3">
                <div className="h-7 w-28 bg-gray-100 rounded-md animate-pulse" />
                <div className="h-5 w-16 bg-gray-50 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Item skeletons */}
            <div className="flex flex-col divide-y divide-gray-50">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4 py-6">
                  <div className="flex gap-4 md:gap-6 items-start w-full">
                    
                    {/* Image skeleton */}
                    <div className="flex flex-col items-center gap-4 flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-xl animate-pulse" />
                      <div className="w-24 h-8 bg-gray-50 rounded-full animate-pulse" />
                    </div>

                    {/* Content skeleton */}
                    <div className="flex flex-col flex-1 min-w-0 gap-3">
                      <div className="h-6 sm:h-7 bg-gray-100 rounded-md w-3/4 animate-pulse" />
                      <div className="h-4 bg-gray-50 rounded-md w-full max-w-md animate-pulse" />
                      <div className="flex items-center gap-1 pt-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="w-3.5 h-3.5 bg-gray-100 rounded-sm animate-pulse" />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="h-7 w-14 bg-gray-100 rounded-md animate-pulse" />
                        <div className="h-7 w-20 bg-gray-50 rounded-md animate-pulse" />
                        <div className="h-7 w-20 bg-gray-100 rounded-md animate-pulse" />
                      </div>
                      <div className="h-9 w-32 bg-gray-50 rounded-lg animate-pulse mt-1" />
                    </div>
                  </div>

                  {/* Action buttons skeleton */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 mt-1 w-full">
                    <div className="flex flex-1 items-center justify-between sm:justify-start gap-3 sm:gap-10 w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-4 w-20 bg-gray-50 rounded-md animate-pulse" />
                      </div>
                      <div className="w-px h-4 bg-gray-100" />
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-4 w-14 bg-gray-50 rounded-md animate-pulse" />
                      </div>
                      <div className="w-px h-4 bg-gray-100" />
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse" />
                        <div className="h-4 w-16 bg-gray-50 rounded-md animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY SKELETON – borderless, clean */}
          <div className="lg:col-span-4 w-full">
            <div className="flex flex-col gap-6">
              
              {/* Header skeleton */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-2">
                <div className="h-7 w-32 bg-gray-100 rounded-md animate-pulse" />
              </div>
              
              {/* Summary rows skeleton */}
              <div className="flex flex-col gap-4 pb-5 border-b border-gray-100">
                <div className="flex justify-between gap-4">
                  <div className="h-5 w-20 bg-gray-50 rounded-md animate-pulse" />
                  <div className="h-5 w-24 bg-gray-100 rounded-md animate-pulse" />
                </div>
                <div className="flex justify-between gap-4">
                  <div className="h-5 w-24 bg-gray-50 rounded-md animate-pulse" />
                  <div className="h-5 w-20 bg-gray-100 rounded-md animate-pulse" />
                </div>
                <div className="flex justify-between gap-4">
                  <div className="h-5 w-28 bg-gray-50 rounded-md animate-pulse" />
                  <div className="h-5 w-16 bg-gray-100 rounded-md animate-pulse" />
                </div>
                <div className="flex justify-between gap-4 pt-4 mt-2 border-t border-gray-100">
                  <div className="h-6 w-24 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-6 w-28 bg-gray-100 rounded-md animate-pulse" />
                </div>
              </div>

              {/* Button skeleton */}
              <div className="w-full">
                <div className="w-full h-14 bg-gray-100 rounded-full animate-pulse" />
              </div>

              {/* Footer note skeleton */}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-gray-50 rounded-full animate-pulse" />
                <div className="h-3 w-48 bg-gray-50 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}