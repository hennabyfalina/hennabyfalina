// src/app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // 1. GATEKEEPER: Verify the request context matches authorized administrative credentials
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const supabase = await createClient()
    
    // 2. EXTRACTION: Destructure query parameters uniformly
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('payment_method')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const userId = searchParams.get('user_id')

    // 🏛️ BIG-TECH OPTIMIZATION: Clean, explicit relational select query string
    let selectStr = `
      id,
      order_number,
      total_amount,
      shipping_cost,
      shipping_method,
      status,
      payment_status,
      payment_method_detail,
      created_at,
      user:users!user_id (id, name, email, phone)
    `
    
    // If a specific client history lookup is active, append line snapshots immediately
    if (userId) {
      selectStr += `, 
        address:addresses!address_id (*), 
        order_items (
          id,
          quantity,
          price,
          original_price,
          variant_string,
          purchase_type,
          product:products (name, sku, images)
        )
      `
    }

    let query = supabase
      .from('orders')
      .select(selectStr)
      .order('created_at', { ascending: false })

    // 3. EXECUTE CONDITIONAL FILTERS
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method_detail', paymentMethod)
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,users.name.ilike.%${search}%`)
    }
    
    if (limit) {
      query = query.limit(parseInt(limit, 10))
    }

    const { data: orders, error } = await query
    if (error) throw error

    return NextResponse.json(orders || [])
  } catch (error: any) {
    console.error('Error fetching admin orders registry:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking metrics logs cleanly.' },
      { status: 500 }
    )
  }
}