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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-900 transition-colors duration-200">
        <ListFilter className="w-3.5 h-3.5" strokeWidth={2} />
      </div>

      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className={`w-full pl-10 pr-10 h-10 appearance-none rounded-full text-[13px] font-medium tracking-tight transition-all duration-200 focus:outline-none cursor-pointer ${
          isAdmin 
            ? 'bg-[#0A0A0A] border border-stone-800 text-white focus:border-blue-500 focus:ring-blue-500' 
            : 'bg-white hover:bg-gray-50/50 border border-gray-100 text-gray-600 hover:text-gray-900 focus:border-gray-900'
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
      
      {/* Dynamic interactive placement arrow matching your design colors */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-900 transition-colors duration-200">
        <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
      </div>
    </div>
  )
}