// src/app/(shop)/loading.tsx

export default function ShopLoading() {
  return (
    <div className="flex-1 flex flex-col w-full bg-[#eaeded] pb-12">
      {/* Hero Section Skeleton - Amazon Style */}
      <div className="w-full max-w-[1500px] mx-auto relative">
        <div className="w-full h-[250px] sm:h-[450px] md:h-[600px] bg-white animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#eaeded]" />

        {/* Main Content Container */}
        <div className="px-2 sm:px-4 relative z-10 -mt-20 sm:-mt-48 md:-mt-64 space-y-4 sm:space-y-6">
          
          {/* Categories Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 shadow-sm flex flex-col h-[320px] sm:h-[420px]">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
                <div className="flex-1 bg-gray-100 animate-pulse mb-4" />
                <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Featured Products Horizontal Strip */}
          <div className="bg-white p-5 shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
            <div className="flex space-x-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[160px] sm:min-w-[200px] space-y-3">
                  <div className="aspect-square bg-gray-100 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Wholesale & Custom Order Split Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-6 shadow-sm h-[300px]">
              <div className="h-7 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-5/6 mb-6 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            <div className="bg-white p-6 shadow-sm h-[300px]">
              <div className="h-7 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-5/6 mb-6 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="bg-white p-8 shadow-sm">
            <div className="h-7 bg-gray-200 rounded w-64 mx-auto mb-10 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-white p-8 shadow-sm">
            <div className="h-7 bg-gray-200 rounded w-48 mb-8 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-100 p-6 space-y-4">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="w-4 h-4 bg-gray-100 rounded-full animate-pulse" />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-24 mt-4 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-100 rounded w-full animate-pulse" />
                <div className="h-12 bg-gray-100 rounded w-full animate-pulse" />
                <div className="h-32 bg-gray-100 rounded w-full animate-pulse" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}