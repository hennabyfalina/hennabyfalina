// src/components/auth/GoogleOneTap.tsx

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleOneTap() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const isInitialized = useRef(false) 

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsProcessing(true)
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) throw error

      localStorage.setItem('last_login_method', 'google')

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

      const params = new URLSearchParams(window.location.search)
      const redirectPath = params.get('next') || params.get('redirect') || '/products'
      
      router.push(redirectPath)
      router.refresh() 

    } catch (error) {
      console.error('[Google One Tap] Auth Error:', error)
      setIsProcessing(false)
    }
  }

  // 🚨 STRICT LOCK & FedCM COMPLIANCE
  const initializeGoogleOneTap = useCallback(() => {
    if (typeof window === 'undefined' || !window.google?.accounts?.id || isInitialized.current) return

    isInitialized.current = true

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      callback: handleCredentialResponse,
      auto_select: true, 
      cancel_on_tap_outside: false,
      context: 'use',
      itp_support: true, 
      use_fedcm_for_prompt: true, 
    })

    // 🚨 VERCEL STYLE: Call prompt completely empty. 
    // This allows the native FedCM browser API to bypass Tracking Prevention.
    window.google.accounts.id.prompt()
    
  }, [router])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
        isInitialized.current = false 
      }
    }
  }, [])

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={initializeGoogleOneTap}
      />
      
      {isProcessing && (
         <div className="fixed top-6 right-6 z-[100] bg-white shadow-lg border border-gray-200 rounded-full px-4 py-2 flex items-center gap-3">
           <div className="w-4 h-4 border-2 border-[#e77600] border-t-transparent rounded-full animate-spin"></div>
           <span className="text-sm font-medium text-gray-800">Signing in securely...</span>
         </div>
      )}
    </>
  )
}