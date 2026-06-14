// src/app/~offline/page.tsx

'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-white px-4 text-center select-none animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-5">
        <WifiOff className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
      </div>
      
      {/* 🚀 FIXED: Shifted string layout to clear Capitalized font case */}
      <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-gray-900 mb-2 capitalize">Connection Lost</h1>
      <p className="text-gray-400 text-[13px] font-medium max-w-xs mb-8 leading-relaxed capitalize">
        It looks like your device is currently offline. Please check your network signal parameters and try again.
      </p>
      
      {/* 🚀 FIXED: Replaced bright yellow tags with clean minimal charcoal capsules */}
      <button 
        onClick={() => window.location.reload()}
        className="h-11 px-8 bg-gray-900 hover:bg-black text-white rounded-full text-[12px] font-bold tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer capitalize"
      >
        Try Again
      </button>
    </div>
  )
}