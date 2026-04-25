// src/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser client for client-side operations
 * Uses anon key - respects RLS policies
 * Safe to use anywhere in client components
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      // Cookie options for better security
      cookieOptions: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}