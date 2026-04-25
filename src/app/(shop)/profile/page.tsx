// src/app/(shop)/profile/page.tsx

import { getProfile } from '@/app/actions/get-profile'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Your Account | ${siteConfig.name}`
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login?redirect=/profile')
  }

  const profile = await getProfile()

  return <ProfileClient user={user} profile={profile || null} />
}