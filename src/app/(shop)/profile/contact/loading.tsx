// src/app/(shop)/contact/loading.tsx

import Container from '@/components/ui/Container'

export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10 animate-pulse">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-40 bg-gray-200 rounded mb-6" />

        {/* Header section skeleton */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Quick Help & Form */}
          <div className="md:col-span-2 space-y-10">
            {/* Quick Help section skeleton */}
            <section>
              <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-1" />
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Form section skeleton */}
            <section className="border-t border-gray-200 pt-8">
              <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-96 bg-gray-200 rounded mb-6" />
              
              <div className="space-y-4">
                {/* Name & Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-10 w-full bg-gray-200 rounded-sm" />
                  </div>
                  <div>
                    <div className="h-4 w-28 bg-gray-200 rounded mb-1" />
                    <div className="h-10 w-full bg-gray-200 rounded-sm" />
                  </div>
                </div>
                
                {/* Order number field */}
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-10 w-full bg-gray-200 rounded-sm" />
                </div>

                {/* Message field */}
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                  <div className="h-28 w-full bg-gray-200 rounded-sm" />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <div className="h-10 w-36 bg-gray-200 rounded-sm" />
                </div>
              </div>
            </section>
          </div>

          {/* Right column - Contact info card skeleton */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}