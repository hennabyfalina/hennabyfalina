// src/components/ui/PWAUpdater.tsx

'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function PWAUpdater() {
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Only run in browser environments that support Service Workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) return

        // Detect when a new update is found in the background
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            registration.installing.addEventListener('statechange', () => {
              if (registration.waiting && navigator.serviceWorker.controller) {
                // 1. Show the Amazon-style update banner
                setIsUpdating(true)
                // 2. Tell the new service worker to take over immediately (Silent update)
                registration.waiting.postMessage({ type: 'SKIP_WAITING' })
              }
            })
          }
        })
      })

      // Listen for the controlling service worker changing (meaning the update is ready)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          // Wait 1.5 seconds so the user can read the "Updating" banner before it auto-refreshes
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      })
    }
  }, [])

  if (!isUpdating) return null

  return (
    <div className="fixed bottom-[84px] md:bottom-4 left-4 right-4 z-[9999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-center gap-4 relative">
        <div className="w-12 h-12 bg-[#F0F8FA] rounded-lg flex items-center justify-center shrink-0">
          {/* Amazon Blue Accent Spinner */}
          <RefreshCw className="w-6 h-6 text-[#007185] animate-spin" />
        </div>
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-bold text-gray-900">Updating App</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Applying the latest features. Refreshing automatically...
          </p>
        </div>
      </div>
    </div>
  )
}