// src/hooks/useAuth.ts

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { broadcast } from '@/lib/broadcast'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isNameMissing, setIsNameMissing] = useState(false)

  const lastCheckedRef = useRef<number>(0)
  const supabase = createClient()

  const fetchUserAndProfile = useCallback(async (force = false) => {
    const now = Date.now()
    // 🛡️ THROTTLE GUARD: Skip redundant queries if verified within the last 2 minutes
    if (!force && lastCheckedRef.current && now - lastCheckedRef.current < 120000) {
      return
    }

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const activeUser = session?.user || null
      setUser(activeUser)

      if (activeUser) {
        // Query explicit columns to optimize data retrieval speeds
        const { data: userData } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', activeUser.id)
          .maybeSingle()
          
        const userRole = userData?.role || 'customer'
        setRole(userRole)
        setIsAdmin(userRole === 'admin' || userRole === 'super_admin')
        setIsSuperAdmin(userRole === 'super_admin')

        const currentName = (userData?.name || '').trim()
        const emailLower = (activeUser.email || '').trim().toLowerCase()
        const emailPrefix = emailLower.split('@')[0]
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

        const isGenerated = !currentName || currentName.toLowerCase() === emailLower || normalize(currentName) === normalize(emailPrefix)
        setIsNameMissing(isGenerated && userRole !== 'super_admin' && userRole !== 'admin')
        
        lastCheckedRef.current = Date.now()
      } else {
        setRole(null)
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setIsNameMissing(false)
        lastCheckedRef.current = 0
      }
    } catch (err) {
      console.error('[Auth Synchronization Fault]:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Initial Sync
  useEffect(() => {
    fetchUserAndProfile(false)
  }, [fetchUserAndProfile])

  // cross-tab sync via single broadcast layout channel
  useEffect(() => {
    const unbind = broadcast.on('AUTH_LOGOUT', () => {
      fetchUserAndProfile(true)
    })

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('supabase-auth-token')) {
        fetchUserAndProfile(true)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      unbind()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchUserAndProfile])

  // Tab focus optimization re-validation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUserAndProfile(false) // Respects the 2-minute throttle window
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUserAndProfile])

  // Listen to Supabase auth changes (same tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchUserAndProfile(true) // Force update on explicit status changes
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchUserAndProfile])

  return { user, role, isAdmin, isSuperAdmin, isLoading, isNameMissing }
}