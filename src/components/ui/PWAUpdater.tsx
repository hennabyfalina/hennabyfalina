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

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            // ONLY trigger when the new service worker is fully downloaded and waiting to take over
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 1. Show the quick 2.5-second notification
              setIsUpdating(true)
              
              // 2. Wait exactly 2.5 seconds, then tell the worker to swap files
              setTimeout(() => {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }, 2500)
            }
          })
        })
      })

      // 3. The moment the files are swapped, do an instant refresh
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }
  }, [])

  if (!isUpdating) return null

  return (
    <div className="fixed bottom-[84px] md:bottom-4 left-4 right-4 z-[9999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-out duration-300">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-center gap-4 relative">
        <div className="w-12 h-12 bg-[#F0F8FA] rounded-lg flex items-center justify-center shrink-0">
          <RefreshCw className="w-6 h-6 text-[#007185] animate-spin" />
        </div>
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-bold text-gray-900">App Updated</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Applying the latest features now...
          </p>
        </div>
      </div>
    </div>
  )
}