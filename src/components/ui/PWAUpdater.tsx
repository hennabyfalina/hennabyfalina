// src/components/ui/PWAUpdater.tsx

'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAdminThemeStore } from '@/store/theme.store'

export default function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false)
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const themeStore = useAdminThemeStore()
  const theme = themeStore?.theme || 'dark'

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) return

        if (registration.waiting) {
          triggerUpdate(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              triggerUpdate(newWorker)
            }
          })
        })
      })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          setIsUpdating(true)
          setTimeout(() => {
            window.location.reload()
          }, 2500)
        }
      })
    }

    function triggerUpdate(worker: ServiceWorker) {
      worker.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [])

  if (!isUpdating) return null

  return (
    <div className={`fixed bottom-[90px] left-4 right-4 z-[99999] md:bottom-6 md:w-96 md:left-auto animate-in slide-in-from-bottom-5 fade-in duration-500 ${isAdmin ? `admin-theme-${theme}` : ''}`}>
      {/* 🚀 FIXED: Dropped cyan color paths for a translucent minimal glass container layer */}
      <div className={`${isAdmin ? 'admin-bg-card border admin-border' : 'bg-white/95 backdrop-blur-md border border-gray-100'} shadow-2xl rounded-2xl p-4 flex items-center gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isAdmin ? 'admin-bg-elevated' : 'bg-stone-50 text-gray-900'}`}>
          <RefreshCw className="w-5 h-5 animate-spin" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-[13px] font-bold tracking-wide capitalize ${isAdmin ? 'admin-text-primary' : 'text-gray-900'}`}>App Updated</h3>
          <p className={`text-[12px] font-medium capitalize mt-0.5 ${isAdmin ? 'admin-text-muted' : 'text-gray-400'}`}>Applying latest changes...</p>
        </div>
      </div>
    </div>
  )
}