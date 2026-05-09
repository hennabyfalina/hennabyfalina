// src/components/admin/DashboardSearchBar.tsx

'use client'

import { Sparkles, ArrowRight } from 'lucide-react'

export default function DashboardSearchBar() {
  return (
    <div className="mt-12 md:mt-20 relative max-w-3xl mx-auto w-full group cursor-pointer" onClick={() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('open-command-palette'))
    }}>
      <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8C7FA] group-hover:scale-110 transition-transform duration-300" />
      <input
        type="text"
        readOnly
        placeholder="Ask anything or search records..."
        className="w-full pl-14 md:pl-16 pr-14 md:pr-20 py-5 md:py-6 bg-[#1E1F20] border border-[#333538] text-[#E3E3E3] rounded-[28px] md:rounded-[32px] text-sm md:text-lg focus:outline-none transition-all group-hover:border-[#444746] group-hover:bg-[#282A2C] cursor-pointer shadow-2xl shadow-black/20 placeholder:text-[#8E9196]"
      />
      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#131314] group-hover:bg-[#A8C7FA] rounded-full transition-colors duration-300 border border-[#333538] group-hover:border-transparent">
        <ArrowRight className="w-5 h-5 text-[#8E9196] group-hover:text-[#131314] transition-colors" />
      </div>
    </div>
  )
}