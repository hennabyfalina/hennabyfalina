//src/services/auth.service.ts

import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ─── Return Type ──────────────────────────────────────────────────────────────

export type AuthResult<T = undefined> = {
  success: boolean
  message: string
  data?: T
}

// ─── Password Validator ───────────────────────────────────────────────────────

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Must include at least one uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Must include at least one number.'
  return null
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional(),
})

export async function signUp(
  rawName: string,
  rawEmail: string,
  rawPassword: string,
  rawPhone?: string
): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse({ name: rawName, email: rawEmail, password: rawPassword, phone: rawPhone })
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." }
  
  const { name, email, password, phone } = parsed.data
  const supabase = createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { name, phone: phone ?? null },
    },
  })

  if (error) {
    if (error.message?.toLowerCase().includes('already registered')) {
      return {
        success: false,
        message: 'An account with this email already exists. Please log in.',
      }
    }
    return { success: false, message: error.message }
  }

  const user = data.user

  if (!user) {
    return { success: false, message: 'Signup failed. Please try again.' }
  }

  // Supabase quirk — existing email returns user with empty identities[]
  if (user.identities && user.identities.length === 0) {
    return {
      success: false,
      message: 'An account with this email already exists. Please log in.',
    }
  }

  // phone is already E.164 from react-phone-number-input
  // || null ensures empty string never reaches the DB constraint

  return {
    success: true,
    message: 'Account created! Please check your email to confirm your account.',
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(1, "Password is required."),
})

export async function signIn(
  rawEmail: string,
  rawPassword: string
): Promise<AuthResult<{ redirectTo: string; role?: string }>> {
  const parsed = signInSchema.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) return { success: false, message: "Invalid email or password." }
  
  const { email, password } = parsed.data
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message === 'Email not confirmed') {
      return {
        success: false,
        message: 'Please confirm your email before logging in. Check your inbox.',
      }
    }
    // Generic message — never reveal "user not found" vs "wrong password"
    return { success: false, message: 'Invalid email or password.' }
  }

  if (!data.session) {
    return { success: false, message: 'Login failed. Please try again.' }
  }

  let userRole = 'customer'
  if (data.session.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.session.user.id)
      .single()
      
    if (profile) {
      userRole = profile.role
    }
  }

  return {
    success: true,
    message: 'Login successful.',
    data: { redirectTo: '/profile', role: userRole },
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<AuthResult> {
  const supabase = createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

  // Never check if email exists — that's an enumeration vulnerability
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
  }

  // ALWAYS return this — never reveal if account exists or not
  return {
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  }
}

// ─── Update Password ──────────────────────────────────────────────────────────

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Password updated successfully.' }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient()

  // Call server action to clear the admin gate cookie
  try {
    await fetch('/api/clear-admin-cookie', { method: 'POST' })
  } catch (err) {}

  const { error } = await supabase.auth.signOut()

  // 🚨 EXPLICIT CROSS-TAB LOGOUT BROADCAST 🚨
  if (typeof window !== 'undefined') {
    try {
      const bc = new BroadcastChannel('auth-sync')
      bc.postMessage({ type: 'LOGOUT' })
      bc.close()
    } catch(e) {}
    try { localStorage.setItem('logout_event', Date.now().toString()) } catch(e) {}
  }

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Signed out successfully.' }
}

// ─── Get Current User with Profile ───────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile: profile ?? null }
}

// ─── Update Phone (profile only) ─────────────────────────────────────────────
// phone should already be E.164 from react-phone-number-input

export async function updateUserPhone(
  userId: string,
  phone: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('users')
    .update({ phone: phone.trim() || null })
    .eq('id', userId)

  if (error) {
    return { success: false, message: 'Failed to update phone number.' }
  }

  return { success: true, message: 'Phone number updated.' }
}
