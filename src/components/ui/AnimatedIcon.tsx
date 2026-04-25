'use client'

import { LucideIcon } from 'lucide-react'

interface AnimatedIconProps {
  icon: LucideIcon
  isActive?: boolean
  className?: string
}

export default function AnimatedIcon({ icon: Icon, isActive, className = '' }: AnimatedIconProps) {
  return (
    <div className={`relative flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-[1.02] text-gray-900' : 'text-gray-500 group-hover:scale-[1.02] group-hover:text-gray-900 group-active:scale-95'} ${className}`}>
      <Icon 
        strokeWidth={isActive ? 2.25 : 1.75} 
        className="w-5 h-5 sm:w-[22px] sm:h-[22px] transition-all duration-300"
        style={{ fill: isActive ? 'currentColor' : 'none', fillOpacity: isActive ? 0.12 : 0 }}
      />
    </div>
  )
}