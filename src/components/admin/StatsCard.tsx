// src/components/admin/StatsCard.tsx

'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Global Privacy Store: Clicking one eye icon syncs all cards
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
  isSensitive?: boolean
}

export default function StatsCard({ title, value, icon, href, isSensitive }: StatsCardProps) {
  const { isDataHidden, togglePrivacy } = useAdminPrivacyStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const stringValue = String(value)
  const isCurrency = stringValue.includes('₹')
  const effectivelySensitive = isSensitive !== undefined ? isSensitive : isCurrency

  const maskedValue = isCurrency ? '₹ ••••••' : '••••••'
  const displayValue = (isMounted && isDataHidden && effectivelySensitive) ? maskedValue : value

  const content = (
    <div className={`admin-bg-card rounded-[32px] p-6 transition-colors duration-200 border border-transparent ${href ? 'hover:admin-bg-elevated cursor-pointer' : ''} group`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium admin-text-secondary truncate pr-2">{title}</h3>
        {icon && (
          <div className="admin-text-accent">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 overflow-hidden">
        <p className={`text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight truncate transition-all duration-300 ${isMounted && isDataHidden && effectivelySensitive ? 'admin-text-muted' : 'admin-text-primary'}`}>
          {displayValue}
        </p>

        {effectivelySensitive && isMounted && (
          <button 
            onClick={(e) => {
              e.preventDefault()
              togglePrivacy()
            }}
            className="p-2 -mr-2 admin-text-muted hover:admin-text-primary hover:admin-bg-elevated rounded-full transition-colors focus:outline-none cursor-pointer"
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