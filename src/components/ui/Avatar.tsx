'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface AvatarProps {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
}

export default function Avatar({ name, email, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  // Reset error state when avatarUrl changes
  useEffect(() => {
    setImageError(false)
    setIsLoading(true)
  }, [avatarUrl])

  // Get initials from name or email
  const getInitials = () => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0][0].toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const initials = getInitials()
  const sizeClass = sizeClasses[size]

  // Generate a consistent color based on the name or email
  const getColor = () => {
    const str = name || email || 'user'
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = isAdmin ? [
      'admin-bg-primary border admin-border admin-text-primary',
      'admin-bg-elevated border admin-border admin-text-accent',
    ] : [
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-orange-100 text-orange-700',
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  // Show avatar image if available and no error
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setImageError(true)}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    )
  }

  // Fallback: show initials in colored circle
  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium ${sizeClass} ${getColor()} ${className}`}
    >
      {initials}
    </div>
  )
}