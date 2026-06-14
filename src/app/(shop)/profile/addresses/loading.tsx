// src/app/(shop)/profile/addresses/loading.tsx

import Container from '@/components/ui/Container'

export default function AddressesLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-14 animate-pulse select-none text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-44 bg-stone-100 rounded-md mb-5" />

        {/* Page title skeleton */}
        <div className="h-8 w-44 bg-stone-100 rounded-lg mb-8" />

        {/* Address cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Add Address card wireframe wrapper */}
          <div className="h-[280px] border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center bg-white">
            <div className="w-10 h-10 bg-stone-100 rounded-full mb-3" />
            <div className="h-5 w-28 bg-stone-100 rounded-md" />
          </div>

          {/* Existing address cards wireframes */}
          {[1, 2].map((i) => (
            <div key={i} className="h-[280px] border border-gray-100 rounded-2xl p-6 flex flex-col bg-white">
              {/* Primary/Secondary badge line */}
              <div className="h-4 w-28 bg-stone-100 rounded-md mb-4 pb-2" />
              
              {/* Address content column lines */}
              <div className="flex-1 space-y-3">
                <div className="h-5 w-36 bg-stone-100 rounded-md" />
                <div className="h-4 w-full bg-stone-100 rounded-md" />
                <div className="h-4 w-4/5 bg-stone-100 rounded-md" />
                <div className="h-4 w-40 bg-stone-100 rounded-md" />
                <div className="h-4 w-28 bg-stone-100 rounded-md pt-1" />
              </div>
              
              {/* Action buttons footer strip */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-50">
                <div className="h-4 w-10 bg-stone-100 rounded-md" />
                <div className="h-4 w-14 bg-stone-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        
      </Container>
    </div>
  )
}