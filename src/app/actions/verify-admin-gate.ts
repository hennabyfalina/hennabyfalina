// src/app/actions/verify-admin-gate.ts
'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '5 m'), // Max 5 attempts per 5 minutes
    })
  : null

export async function verifyAdminGate(code: string): Promise<{ success: boolean; error?: string }> {
  // 🚨 Rate Limit Check to prevent Brute-Force Attacks
  if (ratelimit) {
    const { headers } = await import('next/headers')
    const ip = (await headers()).get('x-forwarded-for') || 'unknown'
    const { success } = await ratelimit.limit(`admin_gate_attempt_${ip}`)
    if (!success) {
      return { success: false, error: 'Too many failed attempts. Please try again in 5 minutes.' }
    }
  }

  const expectedCode = process.env.ADMIN_ACCESS_CODE

  // Remove console logs in production
  if (process.env.NODE_ENV === 'development') {
    console.log('[verify] === START ===')
    console.log('[verify] Expected code exists:', !!expectedCode)
  }

  if (!expectedCode) {
    console.error('[verify] ADMIN_ACCESS_CODE not set')
    return { success: false, error: 'Configuration error. Please contact administrator.' }
  }

  // Use constant-time comparison to prevent timing attacks
  if (!constantTimeCompare(code, expectedCode)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[verify] Code mismatch')
    }
    return { success: false, error: 'Invalid access code.' }
  }

  // Validate that the user is actually logged in and is an admin
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: 'You must be logged in.' }
  }

  // Use maybeSingle() instead of single() to avoid errors
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized.' }
  }

  // Set secure HTTP‑only cookie with enhanced security
  const cookieStore = await cookies()
  cookieStore.set('admin_gate_passed', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
    // Add priority for better cookie handling
    priority: 'high',
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('[verify] Cookie set successfully')
    console.log('[verify] === END, returning success ===')
  }

  return { success: true }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}