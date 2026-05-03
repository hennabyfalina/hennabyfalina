// src/app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin-auth'
import Razorpay from 'razorpay'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const { id } = await params
    const supabase = await createClient()

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await verifyAdmin(['super_admin'])
    if (!authorized) return response!

    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const { id } = await params
    // 🚨 Extracting Tracking Data from Request 🚨
    const orderPatchSchema = z.object({
      status: z.string().min(1),
      reason: z.string().optional(),
      courier_name: z.string().optional(),
      tracking_number: z.string().optional(),
      tracking_url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
    })

    const rawBody = await request.json()
    const parsed = orderPatchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
    }

    const { status, reason, courier_name, tracking_number, tracking_url } = parsed.data

    const supabase = await createClient()

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