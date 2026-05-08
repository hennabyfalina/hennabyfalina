// src/components/auth/GoogleOneTap.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

// Tell TypeScript about the global Google object
declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleOneTap() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Fallback initialization in case the Next.js script loaded before the component fully mounted
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initializeGoogleOneTap()
    }

    // 🚨 CANCEL GOOGLE ONE TAP ON UNMOUNT TO PREVENT PWA GLITCHES 🚨
    return () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [])

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsProcessing(true)
      const supabase = createClient()
      
      // 🚨 FAST PATH: Exchange Google's silent JWT token directly with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) throw error

      // Record the successful login method for our "Last Used" badge
      localStorage.setItem('last_login_method', 'google')

      // Check if admin or customer to route them correctly
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        if (userData?.role === 'admin') {
          window.location.href = '/admin-gate'
          return
        }
      }

      // Route to the intended page (e.g., checkout or products)
      const params = new URLSearchParams(window.location.search)
      const redirectPath = params.get('next') || params.get('redirect') || '/products'
      
      router.push(redirectPath)
      router.refresh() // Force Next.js to update server components with new auth state

    } catch (error) {
      console.error('[Google One Tap] Auth Error:', error)
      setIsProcessing(false)
    }
  }

  const initializeGoogleOneTap = () => {
    if (!window.google?.accounts?.id) return

    // 🚨 ENTERPRISE ONE-TAP CONFIGURATION 🚨
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      callback: handleCredentialResponse,
      auto_select: true, // Automatically sign in if the user has a single active Google session
      cancel_on_tap_outside: false,
      context: 'use',
      itp_support: true, // Crucial for Safari and Firefox Privacy protections
      use_fedcm_for_prompt: true, // Uses native browser UI for higher conversion rates & adblocker bypass
    })

    // Trigger the slide-in UI
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('[Google One Tap] Skipped or blocked:', notification.getNotDisplayedReason() || notification.getSkippedReason())
      }
    })
  }

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={initializeGoogleOneTap}
        onReady={initializeGoogleOneTap}
      />
      
      {/* 🚨 Processing Indicator: Appears top-right while verifying the token */}
      {isProcessing && (
         <div className="fixed top-6 right-6 z-[100] bg-white shadow-lg border border-gray-200 rounded-full px-4 py-2 flex items-center gap-3">
           <div className="w-4 h-4 border-2 border-[#e77600] border-t-transparent rounded-full animate-spin"></div>
           <span className="text-sm font-medium text-gray-800">Signing in securely...</span>
         </div>
      )}
    </>
  )
}