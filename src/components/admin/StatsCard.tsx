// src/components/admin/StatsCard.tsx

'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  href?: string
}

export default function StatsCard({ title, value, icon, href }: StatsCardProps) {
  const content = (
    <div className={`bg-[#1E1F20] rounded-[32px] p-6 transition-colors duration-200 border border-transparent ${href ? 'hover:bg-[#282A2C] cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-[#C4C7C5] truncate pr-2">{title}</h3>
        {icon && (
          <div className="text-[#A8C7FA]">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-3 overflow-hidden">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#E3E3E3] truncate">
          {value}
        </p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block group">{content}</Link>
  }

  return content
}