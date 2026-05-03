// src/lib/admin-auth.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function verifyAdmin(allowedRoles: ('admin' | 'super_admin')[] = ['admin', 'super_admin']) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || !allowedRoles.includes(profile.role as any)) {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { authorized: true, user, role: profile.role }
}