// src/components/ui/SplashScreen.tsx

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAdminThemeStore } from '@/store/theme.store'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const themeStore = useAdminThemeStore()
  const theme = themeStore?.theme || 'dark'

  useEffect(() => {
    // Check if running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    // If not in PWA mode, never show splash
    if (!isStandalone) {
      setVisible(false)
      return
    }

    // Check if this is the first load of the session
    // sessionStorage clears when the tab is closed, but persists during navigation
    const hasSeenSplash = sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      // First load in this session → show splash
      setVisible(true)
      sessionStorage.setItem('splash_shown', 'true')
      
      // Fade out after 400ms
      setTimeout(() => {
        setVisible(false)
      }, 400)
    } else {
      // Already seen splash during this session (navigation) → don't show
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-400 ease-out animate-out fade-out ${isAdmin ? `admin-bg-primary admin-theme-${theme}` : 'bg-white'}`}>
      <div className="w-32 h-32 relative animate-in zoom-in duration-300">
        <Image
          src="/icon-512x512.png"
          alt="Logo"
          fill
          sizes="128px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}