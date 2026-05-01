// src/components/admin/DashboardSearchBar.tsx

'use client'

import { Sparkles } from 'lucide-react'

export default function DashboardSearchBar() {
  return (
    <div className="mt-8 relative max-w-2xl w-full group cursor-pointer" onClick={() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('open-command-palette'))
    }}>
      <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8C7FA]" />
      <input
        type="text"
        readOnly
        placeholder="Search orders, products, or customers..."
        className="w-full pl-14 pr-16 py-4 bg-[#1E1F20] border border-[#333538] text-[#E3E3E3] rounded-full text-base focus:outline-none transition-shadow group-hover:border-[#565959] cursor-pointer"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-50">
        <span className="bg-[#131314] border border-[#333538] px-2 py-1 rounded-md text-xs font-mono text-[#E3E3E3]">Alt</span>
        <span className="bg-[#131314] border border-[#333538] px-2 py-1 rounded-md text-xs font-mono text-[#E3E3E3]">K</span>
      </div>
    </div>
  )
}