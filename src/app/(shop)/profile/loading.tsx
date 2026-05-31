// src/app/(shop)/cart/loading.tsx

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#F0F2F2] py-8">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar skeleton */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-md p-4 space-y-2 animate-pulse">
              <div className="h-10 bg-gray-100 rounded w-full" />
              <div className="h-10 bg-gray-100 rounded w-full" />
              <div className="h-10 bg-gray-100 rounded w-full" />
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-md p-6 space-y-4 animate-pulse">
              <div className="h-8 bg-gray-100 rounded w-1/2" />
              <div className="h-20 bg-gray-100 rounded w-full" />
              <div className="h-20 bg-gray-100 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}