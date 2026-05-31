'use client'

import { usePathname } from 'next/navigation'

interface SortDropdownProps {
  value: string
  onChange: (value: string) => void
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] ${
        isAdmin 
          ? 'admin-bg-primary border admin-border admin-text-primary focus:border-[#A8C7FA]' 
          : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500'
      }`}
      aria-label="Sort products"
    >
      <option value="newest" className={isAdmin ? 'admin-bg-card' : ''}>Newest Arrivals</option>
      <option value="price_asc" className={isAdmin ? 'admin-bg-card' : ''}>Price: Low to High</option>
      <option value="price_desc" className={isAdmin ? 'admin-bg-card' : ''}>Price: High to Low</option>
      <option value="name_asc" className={isAdmin ? 'admin-bg-card' : ''}>Name: A to Z</option>
    </select>
  )
}