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
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    setIsStandalone(isAppStandalone)

    if (isAppStandalone) return

    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed')
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 3) return
    }

    const isDeviceIOS = 
      (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isDeviceIOS) {
      setIsIOS(true)
      setShowPrompt(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    
    const handleAppInstalled = () => {
      setIsInstalling(false)
      setDeferredPrompt(null)
      setShowPrompt(false)
      showToast('App installed successfully! Add it to your home screen context.', 'success')
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
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    } else {
      setIsInstalling(false)
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString())
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 z-[99999] md:left-auto md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-2xl p-5 flex items-start gap-4 relative">
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-stone-50 transition-colors cursor-pointer" aria-label="Close notification">
          <X className="w-3.5 h-3.5" />
        </button>
        
        <div className="w-11 h-11 bg-stone-50 rounded-xl flex items-center justify-center shrink-0 text-gray-900">
          <Smartphone className="w-5 h-5" strokeWidth={1.5} />
        </div>
        
        <div className="flex-1 pr-4">
          {/* 🚀 FIXED: Custom dynamic capitalization formatting attributes */}
          <h3 className="text-[14px] font-bold text-gray-900 tracking-wide capitalize">Install {siteConfig.shortName || 'Our Studio App'}</h3>
          {isIOS ? (
            <>
              <p className="text-[12px] text-gray-400 font-medium mt-1 leading-relaxed capitalize">
                To install, tap the Share icon <Share2 className="inline w-3.5 h-3.5 mx-0.5 text-gray-900" strokeWidth={1.8} /> on your Safari navigation drawer menu and select <span className="font-bold text-gray-800">&quot;Add to Home Screen&quot;</span>.
              </p>
              <div className="flex mt-4">
                <button onClick={handleDismiss} className="w-full h-9 bg-stone-50 hover:bg-stone-100 text-gray-700 rounded-full text-[11px] font-bold tracking-wide transition-all capitalize">
                  Got It
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] text-gray-400 font-medium mt-1 capitalize">Access our clean boutique catalog directly from your device screen.</p>
              <div className="flex mt-4">
                <button 
                  onClick={handleInstall} 
                  disabled={isInstalling}
                  className="w-full h-9 bg-gray-900 hover:bg-black text-white rounded-full text-[11px] font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 capitalize"
                >
                  {isInstalling ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Installing...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" strokeWidth={2} /> Install Now</>
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