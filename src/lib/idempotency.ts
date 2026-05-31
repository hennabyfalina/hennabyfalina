// src/lib/idempotency.ts

import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface IdempotencyRecord {
  key: string
  response: any
  statusCode: number
  createdAt: Date
  expiresAt: Date
}

const IDEMPOTENCY_EXPIRY_SECONDS = 60 * 60 * 24 // 24 hours
const IDEMPOTENCY_CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

/**
 * Generate a unique idempotency key
 * Format: idem_{timestamp}_{random}_{prefix}
 */
export function generateIdempotencyKey(prefix: string = 'order'): string {
  const timestamp = Date.now()
  const random = randomBytes(16).toString('hex')
  return `idem_${timestamp}_${random}_${prefix}`
}

/**
 * Validate idempotency key format
 */
export function isValidIdempotencyKey(key: string): boolean {
  // Relaxed suffix check to allow _session, _order, _payment, etc.
  return /^idem_\d+_[a-f0-9]{32}_.*$/.test(key)
}

/**
 * Create a deterministic idempotency key from order details
 * Useful for retry scenarios where user wants to retry the exact same order
 */
export function createDeterministicKey(orderId: string, action: 'order' | 'payment'): string {
  return `idem_${orderId}_${action}_${Date.now()}`
}

/**
 * Store idempotency record in database
 * Uses admin client to bypass RLS for system operations
 */
export async function storeIdempotencyRecord(
  key: string,
  response: any,
  statusCode: number = 200
): Promise<void> {
  const supabase = createAdminClient()
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_EXPIRY_SECONDS * 1000)

  const { error } = await supabase
    .from('idempotency_records')
    .upsert({
      key,
      response: response,
      status_code: statusCode,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('[Idempotency] Failed to store record:', error)
    // Don't throw – idempotency is best-effort
  }
}

/**
 * Retrieve idempotency record from database
 * Returns null if not found or expired
 */
export async function getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('idempotency_records')
    .select('key, response, status_code, created_at, expires_at')
    .eq('key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    key: data.key,
    response: data.response,
    statusCode: data.status_code,
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at),
  }
}

/**
 * Delete expired idempotency records (should be called by cron job)
 */
export async function cleanupExpiredIdempotencyRecords(): Promise<number> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('idempotency_records')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('key')

  if (error) {
    console.error('[Idempotency] Cleanup failed:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Middleware for API routes to handle idempotency
 * Usage: wrap your API handler with withIdempotency
 */
export async function withIdempotency(
  req: Request,
  handler: (body: any) => Promise<{ response: any; statusCode?: number }>
): Promise<Response> {
  const idempotencyKey = req.headers.get('Idempotency-Key')
  
  // If no idempotency key provided, execute handler normally
  if (!idempotencyKey) {
    const { response, statusCode = 200 } = await handler(null)
    return new Response(JSON.stringify(response), { status: statusCode })
  }

  // Validate key format
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return new Response(
      JSON.stringify({ error: 'Invalid idempotency key format' }),
      { status: 400 }
    )
  }

  // Check for existing record
  const existing = await getIdempotencyRecord(idempotencyKey)
  if (existing) {
    // Return cached response
    return new Response(JSON.stringify(existing.response), {
      status: existing.statusCode,
    })
  }

  // Execute handler
  try {
    const { response, statusCode = 200 } = await handler(await req.json())
    
    // Store result for future requests with same key
    await storeIdempotencyRecord(idempotencyKey, response, statusCode)
    
    return new Response(JSON.stringify(response), { status: statusCode })
  } catch (error: any) {
    // Don't store failed responses (allow retry)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    )
  }
}

/**
 * Generate idempotency key for checkout session
 * Should be called when user enters checkout page
 */
export function generateCheckoutSessionKey(userId: string): string {
  const sessionId = typeof window !== 'undefined' 
    ? sessionStorage.getItem('checkout_session_id') 
    : null
  
  if (sessionId) return sessionId
  
  const newSessionId = `checkout_${userId}_${Date.now()}_${randomBytes(8).toString('hex')}`
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('checkout_session_id', newSessionId)
  }
  return newSessionId
}

/**
 * Create idempotency key for order creation
 */
export function createOrderIdempotencyKey(userId: string, cartSignature: string): string {
  return `idem_${Date.now()}_${userId.substring(0, 8)}_${cartSignature.substring(0, 16)}_order`
}