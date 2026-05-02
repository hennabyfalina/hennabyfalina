// src/components/ui/InstallPrompt.tsx

'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share2, Smartphone } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { showToast } from '@/components/ui/Toast'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // 1. Check if the app is already installed and running in standalone mode
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    setIsStandalone(isAppStandalone)

    if (isAppStandalone) return

    // 2. Check our "Snooze" gap (Don't annoy users if they dismissed it recently)
    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed')
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 3) {
        return // User clicked close recently, snooze for 3 days
      }
    }

    // 3. iOS Detection (Apple devices do not support the native install prompt event)
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isDeviceIOS) {
      setIsIOS(true)
      setShowPrompt(true)
      return
    }

    // 4. Intercept the standard prompt (Android, Chrome/Edge Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // Stop the browser's random mini-infobar from appearing
      setDeferredPrompt(e) // Save the event so we can trigger it from our custom button
      setShowPrompt(true)
    }
    
    // 🚨 Real Hardware Event: Fire success message ONLY when OS installation finishes
    const handleAppInstalled = () => {
      setIsInstalling(false)
      setDeferredPrompt(null)
      setShowPrompt(false)
      showToast('App installed successfully! You can now open it from your Home Screen.', 'success')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setIsInstalling(true)
    deferredPrompt.prompt() // Show the native browser installation dialog
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      // We do NOT show the toast here. We wait for the OS 'appinstalled' event.
      setShowPrompt(false)
    } else {
      setIsInstalling(false)
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString()) // Start the 3-day snooze
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-[84px] md:bottom-4 left-4 right-4 z-[9999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-start gap-4 relative">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 bg-[#F0F8FA] rounded-xl flex items-center justify-center shrink-0">
          <Smartphone className="w-6 h-6 text-[#007185]" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-bold text-gray-900">Install {siteConfig.shortName || 'Our App'}</h3>
          {isIOS ? (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              To install, tap the Share icon <Share2 className="inline w-3 h-3 mx-0.5 text-gray-800" /> below and select <span className="font-bold">"Add to Home Screen"</span>.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600 mt-1">Faster access and better experience.</p>
              <div className="flex mt-3">
                <button 
                  onClick={handleInstall} 
                  disabled={isInstalling}
                  className="w-full bg-[#007185] hover:bg-[#005d6e] text-white px-3 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isInstalling ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Installing...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Install Now</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}