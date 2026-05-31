// src/components/ui/PriceRangeInputs.tsx

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface PriceRangeInputsProps {
  initialMin: string
  initialMax: string
  onChange: (min: string | null, max: string | null) => void
}

export default function PriceRangeInputs({ initialMin, initialMax, onChange }: PriceRangeInputsProps) {
  const [min, setMin] = useState(initialMin)
  const [max, setMax] = useState(initialMax)
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const inputClass = isAdmin
    ? "w-full pl-7 pr-2 py-2 admin-bg-primary border admin-border rounded-sm text-sm font-medium admin-text-primary focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] shadow-sm transition-shadow"
    : "w-full pl-7 pr-2 py-2 border border-gray-300 rounded-sm text-sm font-medium text-[#0F1111] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185] bg-white shadow-sm transition-shadow"

  useEffect(() => {
    const timer = setTimeout(() => {
      if (min !== initialMin || max !== initialMax) {
        onChange(min || null, max || null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [min, max, initialMin, initialMax, onChange])

  useEffect(() => {
    setMin(initialMin)
    setMax(initialMax)
  }, [initialMin, initialMax])

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <span className={`absolute left-3 top-2 text-sm ${isAdmin ? 'admin-text-muted' : 'text-gray-500'}`}>₹</span>
        <input 
          type="number" 
          placeholder="Min" 
          value={min} 
          onChange={e => setMin(e.target.value)} 
          className={inputClass} 
        />
      </div>
      <span className={`text-sm ${isAdmin ? 'admin-text-muted' : 'text-gray-400'}`}>-</span>
      <div className="relative flex-1">
        <span className={`absolute left-3 top-2 text-sm ${isAdmin ? 'admin-text-muted' : 'text-gray-500'}`}>₹</span>
        <input 
          type="number" 
          placeholder="Max" 
          value={max} 
          onChange={e => setMax(e.target.value)} 
          className={inputClass} 
        />
      </div>
    </div>
  )
}