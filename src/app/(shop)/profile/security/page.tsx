// src/app/(shop)/profile/security/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SecurityClient from './SecurityClient'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Login & Security | ${siteConfig.name} Studio`
}

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/profile/security')
  }

  // Hydrate personal session parameters from core data rows
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Hydrate primary phone contact records directly from the database schema indices
  const { data: addressData } = await supabase
    .from('addresses')
    .select('phone')
    .eq('user_id', session.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  const addressPhone = addressData?.[0]?.phone || null

  return <SecurityClient sessionUser={session.user} userData={userData} addressPhone={addressPhone} />
}