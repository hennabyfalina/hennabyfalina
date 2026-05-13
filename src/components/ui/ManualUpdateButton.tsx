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
      // Update is waiting – apply it now
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      showToast('Update applied! Page will reload.', 'info')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      // Check for new version
      await registration?.update()
      showToast('Checking for updates...', 'info')
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
      className="px-4 py-2 bg-[#007185] text-white rounded-full text-sm font-medium hover:bg-[#005d6e] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
    >
      {isUpdating ? (
        <><RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Checking...</>
      ) : (
        <>Check for Updates</>
      )}
    </button>
  )
}