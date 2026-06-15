// src/components/ui/SortDropdown.tsx

'use client'

import { usePathname } from 'next/navigation'
import { ChevronDown, ListFilter } from 'lucide-react'

interface SortDropdownProps {
  value: string
  onChange: (value: string) => void
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <div className="relative w-full sm:w-fit group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-950 transition-colors duration-200">
        <ListFilter className="w-3.5 h-3.5" strokeWidth={1.8} />
      </div>

      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className={`w-full pl-9 pr-9 h-9 appearance-none rounded-full text-[12px] font-semibold tracking-tight transition-all duration-200 focus:outline-none cursor-pointer ${
          isAdmin 
            ? 'bg-[#0A0A0A] border border-stone-800 text-white focus:border-blue-500 focus:ring-blue-500' 
            : 'bg-white hover:bg-stone-50/40 border border-stone-200 text-gray-600 hover:text-gray-950 focus:border-gray-950'
        }`}
        aria-label="Sort products collection"
      >
        <option value="newest" className={isAdmin ? 'bg-[#0A0A0A] text-white' : 'bg-white text-gray-900'}>
          Featured
        </option>
        <option value="price_asc" className={isAdmin ? 'bg-[#0A0A0A] text-white' : 'bg-white text-gray-900'}>
          Price: Low to High
        </option>
        <option value="price_desc" className={isAdmin ? 'bg-[#0A0A0A] text-white' : 'bg-white text-gray-900'}>
          Price: High to Low
        </option>
        <option value="name_asc" className={isAdmin ? 'bg-[#0A0A0A] text-white' : 'bg-white text-gray-900'}>
          Name: A to Z
        </option>
      </select>
      
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-950 transition-colors duration-200">
        <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.8} />
      </div>
    </div>
  )
}