// src/components/ui/InstallPrompt.tsx

'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share2, CheckCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt() // Show the native browser installation dialog
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setShowPrompt(false)
      }, 4000)
    } else {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString()) // Start the 3-day snooze
  }

  if (!showPrompt || isStandalone) return null

  if (isSuccess) {
    return (
      <div className="fixed bottom-[84px] md:bottom-4 left-4 right-4 z-[9999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] shadow-2xl rounded-xl p-4 flex items-center gap-4 relative">
          <CheckCircle className="w-8 h-8 text-[#16A34A] shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[#14532D]">App Installed!</h3>
            <p className="text-xs text-[#166534] mt-1">Thank you! You can now access it from your home screen or app drawer.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-[84px] md:bottom-4 left-4 right-4 z-[9999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-start gap-4 relative">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <Download className="w-6 h-6 text-[#007185]" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-bold text-gray-900">Install {siteConfig.shortName || 'Our App'}</h3>
          {isIOS ? (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              To install, tap the Share icon <Share2 className="inline w-3 h-3 mx-0.5 text-gray-800" /> below and select <span className="font-bold">"Add to Home Screen"</span>.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600 mt-1">Add to your home screen for a faster, full-screen experience.</p>
              <div className="flex mt-3">
                <button onClick={handleInstall} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm border border-[#FCD200]">
                  Install Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}