// src/app/admin/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useAdminThemeStore } from '@/store/theme.store'
import { Sun, Moon } from 'lucide-react'

export default function AdminSettingsPage() {
  const { theme, toggleTheme } = useAdminThemeStore()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = () => {
    setIsAnimating(true)
    // Small delay to show animation before theme changes
    setTimeout(() => {
      toggleTheme()
      setTimeout(() => setIsAnimating(false), 300)
    }, 50)
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Same style as other pages */}
      <div>
        <h1 className="text-[28px] font-medium admin-text-primary tracking-tight leading-tight">Appearance</h1>
        <p className="text-sm admin-text-secondary mt-1">Customize the look and feel of your admin dashboard.</p>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl">
        <div className="admin-bg-card border admin-border rounded-[32px] p-6 sm:p-8 transition-colors flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className={`p-3 rounded-2xl admin-bg-primary border admin-border transform transition-all duration-300 ${isAnimating ? 'rotate-180 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
              {theme === 'dark' ? (
                <Moon className="w-6 h-6 admin-text-accent" />
              ) : (
                <Sun className="w-6 h-6 admin-text-accent" />
              )}
            </div>
            <div className="truncate">
              <p className="admin-text-primary font-bold text-base sm:text-lg truncate">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
              <p className="text-xs admin-text-muted">Currently active theme</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-full cursor-pointer admin-action-button"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </div>
  )
}