// src/hooks/useAuth.ts

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isNameMissing, setIsNameMissing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const supabase = createClient()

  const fetchUserAndProfile = useCallback(async () => {
    setIsLoading(true)
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
  }, [supabase])

  // Initial load
  useEffect(() => {
    fetchUserAndProfile()
  }, [fetchUserAndProfile])

  // 🚀 CROSS-TAB SYNC: Listen for token changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If the auth token changed in another tab, refresh the user
      if (e.key && e.key.includes('supabase-auth-token')) {
        // Small delay to ensure Supabase client has updated
        setTimeout(() => {
          fetchUserAndProfile()
        }, 100)
      }
      // Handle logout event
      if (e.key === 'logout_event') {
        fetchUserAndProfile()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [fetchUserAndProfile])

  // 🚀 TAB VISIBILITY: Refresh when user returns to this tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became active again – refresh auth state
        fetchUserAndProfile()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUserAndProfile])

  // 🚀 BROADCAST CHANNEL: Listen for logout events from other tabs
  useEffect(() => {
    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('auth-sync')
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          fetchUserAndProfile()
        }
      }
    }
    return () => {
      if (bc) bc.close()
    }
  }, [fetchUserAndProfile])

  // Listen to Supabase auth changes (same tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchUserAndProfile()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserAndProfile])

  return { user, role, isAdmin, isSuperAdmin, isLoading, isNameMissing }
}