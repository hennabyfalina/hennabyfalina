// src/components/ui/PWAUpdater.tsx

'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false)

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
          window.location.reload()
        }
      })
    }

    function triggerUpdate(worker: ServiceWorker) {
      setIsUpdating(true)
      // Wait exactly 2.5 seconds so the user reads the "App Updated" banner before reloading
      setTimeout(() => {
        worker.postMessage({ type: 'SKIP_WAITING' })
      }, 2500)
    }
  }, [])

  if (!isUpdating) return null

  return (
    <div className="fixed bottom-[90px] left-4 right-4 z-[9999] md:bottom-6 md:w-96 md:left-auto animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#F0F8FA] rounded-lg flex items-center justify-center shrink-0">
          <RefreshCw className="w-6 h-6 text-[#007185] animate-spin" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900">App Updated</h3>
          <p className="text-xs text-gray-500 mt-1">Applying latest changes...</p>
        </div>
      </div>
    </div>
  )
}