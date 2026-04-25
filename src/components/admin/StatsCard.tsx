'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  href?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
}

export default function StatsCard({ title, value, icon, trend, href, color = 'gray' }: StatsCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  const content = (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${href ? 'hover:border-gray-300 hover:shadow-sm' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-3">
        <p className="text-2xl font-bold tracking-tight text-gray-900">
          {value}
        </p>
        {trend && (
          <span className={`inline-flex items-center text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return content
}