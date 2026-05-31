// src/app/actions/verify-admin-gate.ts

'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '5 m'), 
    })
  : null

export async function verifyAdminGate(code: string): Promise<{ success: boolean; error?: string }> {
  if (ratelimit) {
    const { headers } = await import('next/headers')
    const ip = (await headers()).get('x-forwarded-for') || 'unknown'
    const { success } = await ratelimit.limit(`admin_gate_attempt_${ip}`)
    if (!success) {
      return { success: false, error: 'Too many failed attempts. Please try again in 5 minutes.' }
    }
  }

  const expectedCode = process.env.ADMIN_ACCESS_CODE
  if (!expectedCode) {
    return { success: false, error: 'Configuration error.' }
  }

  // 🔒 SECURE TIMING LAYER: Generate independent cryptographic SHA-256 hashes 
  // to run comparison computations. This neutralizes length leakage timing vectors completely.
  const inputHash = crypto.createHash('sha256').update(code).digest()
  const expectedHash = crypto.createHash('sha256').update(expectedCode).digest()

  if (inputHash.length !== expectedHash.length || !crypto.timingSafeEqual(inputHash, expectedHash)) {
    return { success: false, error: 'Invalid access code.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: 'Authentication missing.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_gate_passed', 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', // Tightened from Lax for maximum CSRF protection
    maxAge: 3600, 
    path: '/',
    priority: 'high',
  })

  return { success: true }
}