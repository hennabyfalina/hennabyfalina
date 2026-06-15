// src/app/error.tsx

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application Runtime Error:', error)
  }, [error])

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white px-6 select-none">
      <div className="flex flex-col items-center text-center max-w-md -mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="w-16 h-16 bg-stone-50 text-gray-900 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
          <AlertCircle className="w-7 h-7" strokeWidth={1.25} />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">Something went wrong.</h1>
        <p className="text-gray-500 text-base font-normal mb-10 leading-relaxed max-w-[320px]">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-[15px] font-medium transition-all active:scale-[0.98] cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto h-12 px-8 flex items-center justify-center bg-white border border-gray-200 hover:bg-stone-50 text-gray-900 rounded-full text-[15px] font-medium transition-all active:scale-[0.98]"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}