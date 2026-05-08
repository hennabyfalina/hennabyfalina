// src/hooks/useAuth.ts

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isNameMissing, setIsNameMissing] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', session.user.id)
          .maybeSingle()
          
        const userRole = userData?.role || 'customer'
        setRole(userRole)
        setIsAdmin(userRole === 'admin' || userRole === 'super_admin')
        setIsSuperAdmin(userRole === 'super_admin')

        const currentName = (userData?.name || '').trim()
        const emailLower = (session?.user?.email || '').trim().toLowerCase()
        const emailPrefix = emailLower.split('@')[0]
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

        let isGenerated = !currentName || currentName.toLowerCase() === emailLower || normalize(currentName) === normalize(emailPrefix)

        const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        if (isGenerated && googleName) {
          await supabase.from('users').update({ name: googleName }).eq('id', session.user.id)
          isGenerated = false
        }

        setIsNameMissing(isGenerated && userRole !== 'super_admin' && userRole !== 'admin')
      } else {
        setRole(null)
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setIsNameMissing(false)
      }
      setIsLoading(false)
    }

    getUser()

    // 🚨 ENTERPRISE CROSS-TAB SYNCHRONIZATION 🚨
    const handleCrossTabLogout = () => {
      if (typeof window !== 'undefined' && !(window as any).__isSigningOut) {
        (window as any).__isSigningOut = true
        
        // Instantly lock and obscure the UI across all active tabs
        document.body.style.transition = 'all 0.2s ease-out'
        document.body.style.filter = 'blur(20px) grayscale(100%)'
        document.body.style.opacity = '0.4'
        document.body.style.pointerEvents = 'none'

        try { sessionStorage.clear() } catch (e) {}

        // Force a hard replace to instantly wipe history state for secured pages
        window.location.replace('/')
      }
    }

    // 1. Listen via BroadcastChannel (Modern & Instant)
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('auth-sync')
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') handleCrossTabLogout()
      }
    }

    // 2. Listen via Storage Event (Fallback for older browsers/stale contexts)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout_event' || (e.key && e.key.includes('supabase-auth-token') && !e.newValue)) {
        handleCrossTabLogout()
      }
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', handleStorageChange)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        handleCrossTabLogout()
        return
      }

      setUser(session?.user || null)
      if (session?.user) {
        supabase
          .from('users')
          .select('role, name')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            const userRole = data?.role || 'customer'
            setRole(userRole)
            setIsAdmin(userRole === 'admin' || userRole === 'super_admin')
            setIsSuperAdmin(userRole === 'super_admin')
            
            const currentName = (data?.name || '').trim()
            const emailLower = (session?.user?.email || '').trim().toLowerCase()
            const emailPrefix = emailLower.split('@')[0]
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
            
            let isGenerated = !currentName || currentName.toLowerCase() === emailLower || normalize(currentName) === normalize(emailPrefix)
            
            const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
            if (isGenerated && googleName) {
              supabase.from('users').update({ name: googleName }).eq('id', session.user.id).then(() => {})
              isGenerated = false
            }

            setIsNameMissing(isGenerated && userRole !== 'super_admin' && userRole !== 'admin')
            setIsLoading(false)
          })
      } else {
        setRole(null)
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setIsNameMissing(false)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (bc) bc.close()
      if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return { user, role, isAdmin, isSuperAdmin, isLoading, isNameMissing }
}