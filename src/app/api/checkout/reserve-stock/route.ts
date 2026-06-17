// src/app/api/checkout/reserve-stock/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reserveStock, extendReservationExpiry } from '@/services/inventory.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized connection state.' }, { status: 401 })
    }

    const rawBody = await request.json()
    const { sessionId, items, action } = rawBody

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId parameter context.' }, { status: 400 })
    }

    // Workflow stage 1: Extend active stock reservation windows
    if (action === 'extend') {
      await extendReservationExpiry(sessionId)
      return NextResponse.json({ success: true, extended: true })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'The active validation checkout item matrix is empty.' }, { status: 400 })
    }

    // 🛡️ ZERO-TRUST PAYLOAD CLEANING: Restructures the input array to prevent parameter injection
    const secureSanitizedItems = items.map((item: any) => {
      if (!item.product_id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error('Malformed checkout item dataset properties found.')
      }
      return {
        product_id: String(item.product_id),
        quantity: Math.floor(Number(item.quantity))
      }
    })

    // Workflow stage 2: Lock stock allocations securely inside database inventory tables
    const result = await reserveStock(sessionId, secureSanitizedItems, user.id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.errors || 'Inventory lock collision conflict.' }, { status: 409 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error inside stock reservation pool controller:', error)
    return NextResponse.json(
      { error: error.message || 'The stock allocation reservation engine rejected the request.' }, 
      { status: 500 }
    )
  }
}