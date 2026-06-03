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

        // 🚨 1. Check if there's already an update waiting from a background sync
        if (registration.waiting) {
          triggerUpdate(registration.waiting)
        }

        // 🚨 2. Listen for new updates found by the Service Worker actively
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
          // 🚨 Show the banner and delay the hard reload so users can read it
          setIsUpdating(true)
          setTimeout(() => {
            window.location.reload()
          }, 2500)
        }
      })
    }

    function triggerUpdate(worker: ServiceWorker) {
      // If the worker is waiting manually, force it to activate. 
      // The 'controllerchange' listener above will catch it, show the UI, and reload smoothly.
      worker.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [])

  if (!isUpdating) return null

  return (
    <div className={`fixed bottom-[90px] left-4 right-4 z-[9999] md:bottom-6 md:w-96 md:left-auto animate-in slide-in-from-bottom-5 fade-in duration-500 ${isAdmin ? `admin-theme-${theme}` : ''}`}>
      <div className={`${isAdmin ? 'admin-bg-card border admin-border' : 'bg-white border border-gray-200'} shadow-2xl rounded-xl p-4 flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? 'admin-bg-elevated' : 'bg-[#F0F8FA]'}`}>
          <RefreshCw className={`w-6 h-6 animate-spin ${isAdmin ? 'admin-text-accent' : 'text-[#007185]'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-bold ${isAdmin ? 'admin-text-primary' : 'text-gray-900'}`}>App Updated</h3>
          <p className={`text-xs mt-1 ${isAdmin ? 'admin-text-muted' : 'text-gray-500'}`}>Applying latest changes...</p>
        </div>
      </div>
    </div>
  )
}