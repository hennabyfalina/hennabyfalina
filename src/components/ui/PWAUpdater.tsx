'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function PWAUpdater() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    // Only run in browser environments that support Service Workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) return

        // Detect when a new update is found in the background
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            registration.installing.addEventListener('statechange', () => {
              if (registration.waiting) {
                // If there is a pre-existing controller, it means it's an update!
                if (navigator.serviceWorker.controller) {
                  setWaitingWorker(registration.waiting)
                  setShowUpdate(true)
                }
              }
            })
          }
        })
      })
    }
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the new service worker to take over immediately
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      setShowUpdate(false)
      
      // Reload the page to utilize the fresh cache
      window.location.reload()
    }
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Update Available</p>
            <p className="text-xs text-gray-400">A new version of the app is ready.</p>
          </div>
        </div>
        <button onClick={handleUpdate} className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm shrink-0">
          Update Now
        </button>
      </div>
    </div>
  )
}