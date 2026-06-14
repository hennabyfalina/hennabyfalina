// src/components/ui/ManualUpdateButton.tsx

'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

export default function ManualUpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false)

  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return

    setIsUpdating(true)
    const registration = await navigator.serviceWorker.getRegistration()
    
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      showToast('Update applied! Core loading refresh.', 'success')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      await registration?.update()
      showToast('Checking for studio updates...', 'success')
      setTimeout(() => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        } else {
          showToast('You already have the latest version.', 'success')
        }
      }, 1500)
    }
    setIsUpdating(false)
  }

  return (
    <button
      onClick={checkForUpdates}
      disabled={isUpdating}
      className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-gray-900 text-white rounded-full text-[14px] font-bold tracking-wide hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
    >
      {isUpdating ? (
        <><RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={2} /> Checking...</>
      ) : (
        <>Check For Updates</>
      )}
    </button>
  )
}