// src/app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const supabase = await createClient()
    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('payment_method')
    const search = searchParams.get('search')

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        payment_status,
        payment_method_detail,
        created_at,
        users!user_id (name)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method_detail', paymentMethod)
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,users.name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const formattedOrders = (data || []).map(order => ({
      ...order,
      users: Array.isArray(order.users) ? order.users[0] : order.users,
    }))

    return NextResponse.json(formattedOrders)
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}