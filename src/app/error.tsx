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
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white px-4 select-none">
      <div className="flex flex-col items-center text-center max-w-sm -mt-16 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-5">
          <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        </div>
        
        {/* 🚀 FIXED: Subdued luxury copy structure instead of harsh error strings */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-gray-900 mb-2 capitalize">Something Went Wrong</h1>
        <p className="text-gray-400 text-[13px] font-medium mb-8 leading-relaxed capitalize">
          We encountered an unexpected technical glitch. Our studio engineering monitors are updating a resolution.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto h-11 px-6 bg-gray-900 hover:bg-black text-white rounded-full text-[12px] font-bold tracking-wide transition-all shadow-md cursor-pointer capitalize active:scale-[0.99]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto h-11 px-6 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-gray-700 rounded-full text-[12px] font-bold tracking-wide transition-all capitalize"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}