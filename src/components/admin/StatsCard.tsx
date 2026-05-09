// src/components/admin/StatsCard.tsx

'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 🚨 1. Global Privacy Store: Clicking one eye icon syncs all cards
interface PrivacyState {
  isDataHidden: boolean
  togglePrivacy: () => void
}

export const useAdminPrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      isDataHidden: false,
      togglePrivacy: () => set((state) => ({ isDataHidden: !state.isDataHidden })),
    }),
    { name: 'admin-privacy-lock' }
  )
)

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  href?: string
  isSensitive?: boolean // Manual override for non-currency cards (like Inventory)
}

export default function StatsCard({ title, value, icon, href, isSensitive }: StatsCardProps) {
  const { isDataHidden, togglePrivacy } = useAdminPrivacyStore()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent Next.js hydration mismatch on initial load
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 🚨 2. DRY Auto-Detection: Automatically protects anything with a Rupee symbol
  const stringValue = String(value)
  const isCurrency = stringValue.includes('₹')
  const effectivelySensitive = isSensitive !== undefined ? isSensitive : isCurrency

  // 🚨 3. Smart Masking: Keeps the currency symbol visible if it's money
  const maskedValue = isCurrency ? '₹ ••••••' : '••••••'
  const displayValue = (isMounted && isDataHidden && effectivelySensitive) ? maskedValue : value

  const content = (
    <div className={`bg-[#1E1F20] rounded-[32px] p-6 transition-colors duration-200 border border-transparent ${href ? 'hover:bg-[#282A2C] cursor-pointer' : ''} group`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-[#C4C7C5] truncate pr-2">{title}</h3>
        {icon && (
          <div className="text-[#A8C7FA]">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 overflow-hidden">
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight truncate transition-all duration-300 ${isMounted && isDataHidden && effectivelySensitive ? 'text-[#8E9196]' : 'text-[#E3E3E3]'}`}>
          {displayValue}
        </p>

        {/* 🚨 4. The Bank-Grade Toggle Button */}
        {effectivelySensitive && isMounted && (
          <button 
            onClick={(e) => {
              e.preventDefault() // Prevents triggering the Link if the card is clickable
              togglePrivacy()
            }}
            className="p-2 -mr-2 text-[#8E9196] hover:text-[#E3E3E3] hover:bg-[#333538] rounded-full transition-colors focus:outline-none cursor-pointer"
            aria-label={isDataHidden ? "Show value" : "Hide value"}
            title={isDataHidden ? "Reveal Data" : "Hide Data"}
          >
            {isDataHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block group">{content}</Link>
  }

  return content
}