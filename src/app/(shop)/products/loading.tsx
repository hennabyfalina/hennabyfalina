// src/app/(shop)/products/loading.tsx

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[#F0F2F2]">
      <div className="max-w-[1500px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <div className="hidden md:block w-[240px] shrink-0">
            <div className="bg-white rounded-sm p-4 space-y-4">
              <div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Products grid skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-sm p-3 space-y-2 animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-sm" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}