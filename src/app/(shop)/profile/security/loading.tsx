// src/app/(shop)/profile/security/loading.tsx

import Container from '@/components/ui/Container'

export default function SecurityLoading() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 animate-pulse">
      <Container className="max-w-[800px]">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />

        {/* Header with title and badge skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-6 w-28 bg-gray-200 rounded-full" />
        </div>

        {/* Settings card skeleton */}
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
          
          {/* Name Row */}
          <div className="p-4 sm:p-5 flex justify-between items-center border-b border-gray-200">
            <div className="space-y-1">
              <div className="h-4 w-12 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>

          {/* Email Row */}
          <div className="p-4 sm:p-5 flex justify-between items-center border-b border-gray-200">
            <div className="space-y-1">
              <div className="h-4 w-12 bg-gray-200 rounded" />
              <div className="h-5 w-48 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>

          {/* Phone Row */}
          <div className="p-4 sm:p-5 flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded mt-1" />
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>

        </div>
      </Container>
    </div>
  )
}