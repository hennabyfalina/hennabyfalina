// src/components/admin/AdminLoader.tsx

'use client'

import { useEffect, useState } from 'react'

interface AdminLoaderProps {
  message?: string
  fullScreen?: boolean
}

export default function AdminLoader({ message = '', fullScreen = false }: AdminLoaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read theme from localStorage immediately
    const stored = localStorage.getItem('admin-theme-preference')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.state?.theme === 'light') {
          setTheme('light')
        } else if (parsed.state?.theme === 'dark') {
          setTheme('dark')
        }
      } catch (e) {}
    }
    setMounted(true)
  }, [])

  const themeClass = mounted ? `admin-theme-${theme}` : 'admin-theme-dark'

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-8">
      <svg className="w-10 h-10 animate-spin admin-text-accent" viewBox="0 0 50 50">
        <circle className="opacity-25" cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle className="opacity-100" cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="90 150" strokeDashoffset="0" />
      </svg>
      {message && <p className="mt-4 font-sans text-sm font-medium tracking-wide admin-text-secondary">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`min-h-screen admin-bg-primary flex flex-col items-center justify-center ${themeClass}`} suppressHydrationWarning>
        {loaderContent}
      </div>
    )
  }

  return (
    <div className={`w-full flex justify-center items-center py-10 ${themeClass}`}>
      {loaderContent}
    </div>
  )
}