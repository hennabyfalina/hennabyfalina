// src/components/admin/DashboardSearchBar.tsx

'use client'

import { Sparkles } from 'lucide-react'

export default function DashboardSearchBar() {
  return (
    <div className="mt-12 md:mt-20 relative max-w-3xl mx-auto w-full group cursor-pointer" onClick={() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('open-command-palette'))
    }}>
      <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8C7FA] group-hover:scale-110 transition-transform duration-300" />
      <input
        type="text"
        readOnly
        placeholder="Search orders, products, or customers..."
        className="w-full pl-14 md:pl-16 pr-6 md:pr-20 py-5 md:py-6 bg-[#1E1F20] border border-[#333538] text-[#E3E3E3] rounded-[28px] md:rounded-full text-sm md:text-lg focus:outline-none transition-all group-hover:border-[#444746] group-hover:bg-[#282A2C] cursor-pointer shadow-2xl shadow-black/20 placeholder:text-xs md:placeholder:text-base"
      />
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 opacity-40 group-hover:opacity-70 transition-opacity">
        <span className="bg-[#131314] border border-[#333538] px-2 py-1 rounded-lg text-xs font-mono text-[#E3E3E3]">Alt</span>
        <span className="bg-[#131314] border border-[#333538] px-2 py-1 rounded-md text-xs font-mono text-[#E3E3E3]">K</span>
      </div>
    </div>
  )
}