// src/components/ui/GeminiToast.tsx

'use client'

import { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@/store/theme.store'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai'

interface GeminiToastProps {
  message: string
  type?: ToastType
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function GeminiToast({ message, type = 'info', isVisible, onClose, duration = 3000 }: GeminiToastProps) {
  const [isRendered, setIsRendered] = useState(false)
  const themeStore = useAdminThemeStore()
  const theme = themeStore?.theme || 'dark'

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true)
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isRendered) return null

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[999999] admin-theme-${theme}`}>
      <div 
        className={`
          flex items-center justify-between gap-4 px-5 py-3.5 min-w-[320px] max-w-md
          admin-bg-card border admin-border rounded-lg shadow-2xl pointer-events-auto
          transition-all duration-300 ease-out
          ${isVisible ? 'animate-in slide-in-from-bottom-4 fade-in opacity-100 translate-y-0' : 'animate-out slide-out-to-bottom-4 fade-out opacity-0 translate-y-4'}
        `}
      >
        <span className="text-sm font-medium admin-text-primary tracking-wide">
          {message}
        </span>
        <button 
          onClick={onClose}
          className="text-[12px] font-bold admin-text-accent hover:admin-bg-elevated px-3 py-2 rounded transition-colors uppercase tracking-wide cursor-pointer shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  )
}