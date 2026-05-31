// src/app/(shop)/product/[slug]/loading.tsx

export default function ProductDetailsLoading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Image gallery skeleton */}
          <div className="lg:col-span-5">
            <div className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          </div>
          
          {/* Product info skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}