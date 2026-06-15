// src/components/auth/PasskeyOnboardingPrompt.tsx

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Key, X, Sparkles } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'

export default function PasskeyOnboardingPrompt() {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    // 🛡️ SECURITY FILTER: Completely disable prompt on high-focus transactional and administration territory
    if (
      isLoading || 
      !user ||
      pathname.includes('/checkout') ||
      pathname.includes('/admin') ||
      pathname.includes('/admin-gate') ||
      pathname.includes('/profile/settings') ||
      pathname.includes('/products') ||
      pathname.includes('/product') ||
      pathname.includes('/products?')
    ) {
      setIsVisible(false)
      return
    }

    const userId = user.id
    
    // LAYER 1 Check: Synchronous local persistent guards to eliminate UI layout shifts
    const isDismissed = localStorage.getItem(`passkey_prompt_dismissed_${userId}`) === 'true'
    const alreadyHasPasskey = localStorage.getItem(`passkey_registered_${userId}`) === 'true'

    if (isDismissed || alreadyHasPasskey) {
      setIsVisible(false)
      return
    }

    // LAYER 2 Check: Verify sessionStorage token flags to save Supabase Disk IO credits
    const wasCheckedThisSession = sessionStorage.getItem(`passkey_session_checked_${userId}`) === 'true'
    if (wasCheckedThisSession) {
      setIsVisible(true)
      return
    }

    async function checkRegisteredPasskeys() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.passkey.list()
        
        sessionStorage.setItem(`passkey_session_checked_${userId}`, 'true')

        if (data && data.length > 0) {
          localStorage.setItem(`passkey_registered_${userId}`, 'true')
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
      } catch (e) {
        console.error('[Passkey Performance Guard Check Error]:', e)
      }
    }

    checkRegisteredPasskeys()
  }, [user, isLoading, pathname])

  const handleRegisterPasskey = async () => {
    if (!user) return
    setRegistering(true)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.registerPasskey()

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('cancelled') || msg.includes('user cancelled')) {
          showToast('Registration cancelled', 'error')
        } else {
          showToast(`Setup failed: ${error.message}`, 'error')
        }
      } else if (data) {
        showToast('1-Touch login activated successfully!', 'success')
        localStorage.setItem(`passkey_registered_${user.id}`, 'true')
        setIsVisible(false)
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error')
    } finally {
      setRegistering(false)
    }
  }

  const handleDismissPrompt = () => {
    if (user) {
      localStorage.setItem(`passkey_prompt_dismissed_${user.id}`, 'true')
    }
    setIsVisible(false)
  }

  if (!isVisible) return null

  // 🚀 DYNAMIC OFFSET LOGIC: Detect mobile product sheets to handle stacking
  const isMobileProductPage = pathname.startsWith('/product/')

  return (
    /* Weightless top-line utility notification ribbon banner container stripe */
    <div 
      className={`w-full bg-stone-50 border-b border-stone-100 px-4 py-2.5 animate-in slide-in-from-top duration-300 select-none text-left
        ${isMobileProductPage ? 'mt-14 md:mt-0' : 'mt-0'}
      `}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left Informational Typography Layout Strings */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-white border border-stone-200/60 flex items-center justify-center shrink-0 hidden sm:flex">
            <Key className="w-3 h-3 text-gray-950" strokeWidth={2.2} />
          </div>
          <p className="text-[13px] font-medium text-gray-500 tracking-tight leading-tight capitalize">
            <span className="hidden sm:inline">Bypass verification codes on your next visit. </span>
            <span className="font-semibold text-gray-950">
              Activate 1-Touch <span className="hidden xs:inline">biometric</span> login safely.
            </span>
          </p>
        </div>

        {/* Right Interactive Option Action Handles Matrix */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={registering}
            onClick={handleRegisterPasskey}
            className="h-7 px-3.5 bg-black hover:bg-stone-900 text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer outline-none flex items-center gap-1 active:scale-[0.98] disabled:opacity-40"
          >
            <Sparkles className="w-3 h-3 text-white/95" strokeWidth={2} />
            <span>{registering ? 'Activating...' : 'Setup Face ID'}</span>
          </button>
          
          {/* Subtle Dismiss Handle */}
          <button
            type="button"
            onClick={handleDismissPrompt}
            aria-label="Dismiss secure notice"
            className="p-1 text-gray-400 hover:text-gray-950 transition-colors outline-none border-none bg-transparent cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.2} />
          </button>
        </div>

      </div>
    </div>
  )
}