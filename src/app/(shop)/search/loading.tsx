// src/app/(shop)/search/loading.tsx

export default function SearchLoading() {
  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 py-8 min-h-screen">
      {/* Header skeleton */}
      <div className="mb-4 border-b border-gray-200 pb-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
      </div>

      {/* Filters bar skeleton */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:hidden flex gap-2">
          <div className="flex-1 h-10 bg-gray-100 rounded-sm animate-pulse" />
          <div className="flex-1 h-10 bg-gray-100 rounded-sm animate-pulse" />
        </div>
        <div className="hidden md:block w-[240px] shrink-0">
          <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-4">
            <div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded w-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results count skeleton */}
      <div className="hidden md:flex justify-between items-center bg-white p-3 border border-gray-200 rounded-sm mb-4">
        <div className="h-5 bg-gray-100 rounded w-48 animate-pulse" />
      </div>

      {/* Products grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-sm border border-gray-200 p-3 space-y-2 animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-sm" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}