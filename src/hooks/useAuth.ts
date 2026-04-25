// src/hooks/useAuth.ts

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
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
          
        const currentName = (userData?.name || '').trim()
        const emailLower = (session?.user?.email || '').trim().toLowerCase()
        const emailPrefix = emailLower.split('@')[0]
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

        let isGenerated = !currentName || currentName.toLowerCase() === emailLower || normalize(currentName) === normalize(emailPrefix)

        // Auto-sync Google name if available and current name is missing/generated
        const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        if (isGenerated && googleName) {
          await supabase.from('users').update({ name: googleName }).eq('id', session.user.id)
          isGenerated = false
        }

        setIsAdmin(userData?.role === 'admin')
        setIsNameMissing(isGenerated && userData?.role !== 'admin')
      }
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        supabase
          .from('users')
          .select('role, name')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
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

            setIsAdmin(data?.role === 'admin')
            setIsNameMissing(isGenerated && data?.role !== 'admin')
            setIsLoading(false)
          })
      } else {
        setIsAdmin(false)
        setIsNameMissing(false)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isAdmin, isLoading, isNameMissing }
}