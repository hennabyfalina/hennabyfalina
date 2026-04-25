//src/app/auth/callback/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/profile'

  const supabase = await createClient()

  // ── Path 1: Email confirmation / Magic link (token_hash flow) ──────────────
  // Supabase sends token_hash + type in the confirmation email link
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'recovery' | 'invite' | 'email_change',
    })

    if (error) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=link_invalid`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── Path 2: OAuth / PKCE code exchange ─────────────────────────────────────
  // Supabase sends ?code= for Google OAuth and email confirmation (PKCE flow)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=auth_failed`)
    }

    const user = data.user

    if (!user) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=auth_failed`)
    }

    // Sync profile for OAuth users (Google login)
    // Email/password users already have their profile from signUp()
    // upsert is safe — no crash if profile already exists
    if (user.app_metadata?.provider === 'google') {
      const { error: profileError } = await supabase.from('users').upsert(
        {
          id: user.id,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
          email: user.email ?? '',
        },
        { onConflict: 'id' }
      )

      if (profileError) {
      }
    }

    // Check if the user is an admin to route them to the gate securely
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin-gate`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── Fallback: No valid auth method ─────────────────────────────────────────
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=auth_failed`)
}
