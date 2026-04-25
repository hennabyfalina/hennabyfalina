'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar_url?: string | null  // Add avatar URL field
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  // Get avatar URL from user metadata (Google OAuth provides this)
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  // Use the RPC function that bypasses RLS
  const { data, error } = await supabase.rpc('get_user_profile', { user_id: user.id })
  if (error) {
    console.error('Profile fetch error:', error)
    return null
  }
  
  const profile = data?.[0] || null
  if (profile) {
    return {
      ...profile,
      avatar_url: avatarUrl,
    }
  }
  
  return null
}