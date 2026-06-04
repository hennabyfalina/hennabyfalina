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
        <div className="admin-bg-card border admin-border rounded-[32px] p-6 sm:p-8 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`hidden sm:flex p-3 rounded-2xl admin-bg-primary border admin-border transition-all duration-200 ease-in-out ${isAnimating ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}`}>
              {theme === 'dark' ? (
                <Moon className="w-6 h-6 admin-text-accent" />
              ) : (
                <Sun className="w-6 h-6 admin-text-accent" />
              )}
            </div>
            <div className="flex flex-col">
              <p className="admin-text-primary font-bold text-base sm:text-lg">Dark Mode</p>
            </div>
          </div>
          
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
              theme === 'dark' ? 'bg-[#8AB4F8]' : 'bg-[#565959]/30'
            }`}
          >
            <span className="sr-only">Toggle theme</span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}