'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if you have one
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center text-center max-w-lg -mt-20">
        <AlertTriangle className="w-16 h-16 text-[#e77600] mb-6" strokeWidth={1.5} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Oops! Something went wrong.</h1>
        <p className="text-gray-600 text-sm md:text-base mb-8">
          We&apos;re experiencing a technical issue on our end. Our team has been notified and is working to fix it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm text-sm font-bold text-gray-900 transition-colors shadow-sm"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
}