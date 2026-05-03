// src/lib/idempotency.ts

import { randomBytes } from 'crypto'

/**
 * Generates a unique idempotency key for payment operations
 * Format: idem_{timestamp}_{random}
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now()
  const random = randomBytes(16).toString('hex')
  return `idem_${timestamp}_${random}`
}

/**
 * Validates idempotency key format
 */
export function isValidIdempotencyKey(key: string): boolean {
  return /^idem_\d+_[a-f0-9]{32}$/.test(key)
}

/**
 * Creates a deterministic idempotency key from order details
 * Useful for retry scenarios
 */
export function createDeterministicKey(orderId: string, action: string): string {
  return `idem_${orderId}_${action}_${Date.now()}`
}