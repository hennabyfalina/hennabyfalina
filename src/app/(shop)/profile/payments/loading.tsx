// src/app/(shop)/profile/payments/loading.tsx

import Container from '@/components/ui/Container'

export default function PaymentsLoading() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 animate-pulse">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6 pt-2">
            
            {/* Payment card skeleton */}
            <div className="w-full flex items-start p-5 border border-gray-300 bg-gray-50 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                {/* Icon placeholder */}
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0 mt-0.5" />
                
                {/* Text content placeholders */}
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-full max-w-md bg-gray-200 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  )
}