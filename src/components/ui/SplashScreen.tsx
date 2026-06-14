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
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    if (!isStandalone) {
      setVisible(false)
      return
    }

    const hasSeenSplash = sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      setVisible(true)
      sessionStorage.setItem('splash_shown', 'true')
      
      setTimeout(() => {
        setVisible(false)
      }, 500)
    } else {
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center transition-opacity duration-500 ease-out animate-out fade-out ${isAdmin ? `admin-bg-primary admin-theme-${theme}` : 'bg-white'}`}>
      <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
        <div className="w-24 h-24 relative">
          <Image
            src="/icon-512x512.png"
            alt="Studio brand icon snapshot"
            fill
            sizes="96px"
            className="object-contain"
            priority
          />
        </div>
        
        {/* 🚀 FIXED: Custom cursive minimal secondary label anchor */}
        <p className="text-[14px] font-normal tracking-wide text-gray-400 italic lowercase font-serif mt-2" style={{ fontFamily: 'cursive' }}>
          aifa shennado
        </p>
      </div>
    </div>
  )
}