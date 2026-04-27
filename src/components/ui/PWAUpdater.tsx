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
            // Wait for the worker to be fully installed before triggering UI
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdating(true) 
              
              // Only trigger the update after showing the banner to the user
              setTimeout(() => {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }, 2500) // Delay the actual update so the banner is visible
            }
          })
        })
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload() // This happens automatically after Skip Waiting
      })
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