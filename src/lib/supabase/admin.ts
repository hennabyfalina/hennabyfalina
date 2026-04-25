// src/lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'

/**
 * Admin client with service role key - USE ONLY IN SERVER CONTEXTS!
 * This bypasses RLS - use with extreme caution.
 * Never expose this client to the browser.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Additional security options
      db: {
        schema: 'public',
      },
    }
  )
}

// Helper to check if we're in a server environment
export const isServer = () => typeof window === 'undefined'

// Warning function to prevent accidental client-side usage
if (typeof window !== 'undefined') {
  console.warn(
    'Admin client imported on client side. This should only be used in server components/API routes!'
  )
}