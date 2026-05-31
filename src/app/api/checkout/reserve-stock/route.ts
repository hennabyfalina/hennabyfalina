// src/app/api/checkout/reserve-stock/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reserveStock, extendReservationExpiry } from '@/services/inventory.service'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, items, action } = await request.json()

  if (!sessionId || (!items?.length && action !== 'extend')) {
    return NextResponse.json({ error: 'Missing sessionId or items' }, { status: 400 })
  }

  if (action === 'extend') {
    await extendReservationExpiry(sessionId)
    return NextResponse.json({ success: true, extended: true })
  }

  // Default: reserve stock
  const result = await reserveStock(sessionId, items, user.id)
  if (!result.success) {
    return NextResponse.json({ error: result.errors }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}