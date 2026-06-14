'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string | null  // Add avatar URL field
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  // Get avatar URL from user metadata (Google OAuth provides this)
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  // Fetch profile from users table directly
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') { // Ignore "no rows returned" error
      console.error('Profile fetch error:', error)
    }
    return null
  }
  if (profile) {
    return {
      ...profile,
      avatar_url: avatarUrl,
    }
  }
  
  return null
}