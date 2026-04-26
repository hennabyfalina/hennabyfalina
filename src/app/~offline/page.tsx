'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4 text-center">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
        <WifiOff className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">You're Offline</h1>
      <p className="text-gray-600 text-sm md:text-base max-w-sm mb-8">
        It looks like you've lost your internet connection. Please check your network settings and try again.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors shadow-sm"
      >
        Try Again
      </button>
    </div>
  )
}
