// src/components/admin/DashboardSearchBar.tsx

'use client'

import { Sparkles, ArrowRight } from 'lucide-react'

export default function DashboardSearchBar() {
  return (
    <div className="mt-12 md:mt-20 relative max-w-3xl mx-auto w-full group cursor-pointer" onClick={() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('open-command-palette'))
    }}>
      <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 admin-text-accent group-hover:scale-110 transition-transform duration-300" />
      <input
        type="text"
        readOnly
        placeholder="Ask anything or search records..."
        className="w-full pl-14 md:pl-16 pr-14 md:pr-20 py-5 md:py-6 admin-bg-card border admin-border admin-text-primary rounded-[28px] md:rounded-[32px] text-sm md:text-lg focus:outline-none transition-all group-hover:border-[#444746] group-hover:admin-bg-elevated cursor-pointer placeholder:admin-text-muted"
      />
      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 admin-bg-primary group-hover:admin-bg-accent rounded-full transition-colors duration-300 border admin-border group-hover:border-transparent">
        <ArrowRight className="w-5 h-5 admin-text-muted group-hover:text-[#131314] transition-colors" />
      </div>
    </div>
  )
}