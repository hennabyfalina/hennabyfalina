// src/app/(shop)/profile/loading.tsx

import Container from '@/components/ui/Container'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 animate-pulse">
      <Container className="max-w-[1000px]">
        {/* Page title skeleton */}
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />

        {/* Grid of account cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
            <div key={item} className="flex items-start gap-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
              {/* Icon placeholder */}
              <div className="w-14 h-14 flex items-center justify-center shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
              </div>
              {/* Text placeholders */}
              <div className="flex-1 space-y-2">
                <div className="h-5 w-28 bg-gray-200 rounded" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}