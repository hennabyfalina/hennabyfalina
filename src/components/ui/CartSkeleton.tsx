// src/components/ui/CartSkeleton.tsx

export default function CartSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F2] py-8">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cart items skeleton */}
          <div className="lg:col-span-8 bg-white rounded-md p-6">
            <div className="h-7 bg-gray-100 rounded w-1/3 animate-pulse mb-4" />
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-24 h-24 bg-gray-100 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order summary skeleton */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-md p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-1/2" />
              <div className="h-10 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}