// src/app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        users!user_id (*),
        addresses!address_id (*),
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      
      if (error.message.includes('relationship')) {
        const { data: orderSimple, error: simpleError } = await supabase
          .from('orders')
          .select(`
            *,
            users (*),
            addresses (*),
            order_items (
              *,
              products (*)
            )
          `)
          .eq('id', id)
          .single()
        
        if (simpleError) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        
        return NextResponse.json(orderSimple)
      }
      
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error in order detail API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 🚨 Extracting Tracking Data from Request 🚨
    const { status, reason, courier_name, tracking_number, tracking_url } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ─── REFUND PROCESSING LOGIC ──────────────
    if (status === 'cancelled' || status === 'returned') {
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('payment_status, payment_method_detail, total_amount, razorpay_payment_id')
        .eq('id', id)
        .single()

      if (currentOrder?.payment_status === 'paid' && currentOrder?.payment_method_detail !== 'cod') {
        if (currentOrder.razorpay_payment_id) {
          try {
            const razorpay = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID!,
              key_secret: process.env.RAZORPAY_KEY_SECRET!,
            })
            await razorpay.payments.refund(currentOrder.razorpay_payment_id, {
              amount: Math.round(currentOrder.total_amount * 100)
            })
            await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', id)
          } catch (refundError) {
            console.error('Razorpay Refund Error:', refundError)
            return NextResponse.json({ error: 'Gateway refund failed' }, { status: 500 })
          }
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────

    // 🚨 Build dynamic update payload 🚨
    const updateData: any = {
      status,
      ...(status === 'cancelled' && reason ? { payment_failed_reason: reason } : {}),
      updated_at: new Date().toISOString(),
    }

    // 🚨 Add Dispatch details if status is Shipped
    if (status === 'shipped') {
      updateData.courier_name = courier_name;
      updateData.tracking_number = tracking_number;
      updateData.tracking_url = tracking_url;
      updateData.shipped_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating order status:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in order patch API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}