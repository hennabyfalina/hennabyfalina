// src/app/(shop)/profile/addresses/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddressesClient from './AddressesClient'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Your Addresses | ${siteConfig.name} Studio`
}

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?next=/profile/addresses')
  }

  // Fetch addresses and order by default first, then newest
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return <AddressesClient initialAddresses={addresses || []} userId={session.user.id} />
}