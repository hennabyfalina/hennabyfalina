// src/app/api/admin/finance/route.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Keep for future toggle activation use (e.g., set to true when ready to calculate 18% GST)
const IS_GST_ACTIVE = false 
const GST_RATE = 0.18

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Optimize data transfer by only selecting the exact validation field needed
  const { data: userData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .limit(1)
    .maybeSingle()

  if (roleError || userData?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')

  let startDate = new Date()
  let endDate = new Date()

  if (range === 'custom' && startParam && endParam) {
    startDate = new Date(startParam)
    endDate = new Date(endParam)
    endDate.setHours(23, 59, 59, 999)
  } else {
    let daysToFetch = 30
    if (range === '3m') daysToFetch = 90
    else if (range === '6m') daysToFetch = 180
    else if (range === '1y') daysToFetch = 365
    
    startDate.setDate(startDate.getDate() - (daysToFetch - 1))
    startDate.setHours(0, 0, 0, 0)
  }

  // Fetch only necessary columns to minimize database pool memory consumption
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, created_at, total_amount, payment_status, razorpay_payment_id')
    .in('payment_status', ['paid', 'refunded'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Database ledger link fault' }, { status: 500 })
  }

  // Process data parameters cleanly
  const formattedLedger = (orders || []).map(order => {
    // Normal baseline directly matches total amount collected
    let taxable_value = order.total_amount
    let gst_amount = 0

    // Alternate mathematical routing for future tax tracking activation
    if (IS_GST_ACTIVE) {
      taxable_value = order.total_amount / (1 + GST_RATE)
      gst_amount = order.total_amount - taxable_value
    }

    return {
      ...order,
      type: order.payment_status === 'refunded' ? 'debit' : 'credit',
      taxable_value,
      gst_amount,
    }
  })

  return NextResponse.json({ ledger: formattedLedger })
}