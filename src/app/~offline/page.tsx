// src/app/~offline/page.tsx

'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white px-6 select-none">
      <div className="flex flex-col items-center text-center max-w-md -mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="w-16 h-16 bg-stone-50 text-gray-900 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
          <WifiOff className="w-7 h-7" strokeWidth={1.25} />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3">No internet connection.</h1>
        <p className="text-gray-500 text-base font-normal mb-10 leading-relaxed max-w-[320px]">
          Your device is currently offline. Please check your network settings and try again.
        </p>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto h-12 px-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-[15px] font-medium transition-all active:scale-[0.98] cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}