'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_gate_passed')

  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/')
}