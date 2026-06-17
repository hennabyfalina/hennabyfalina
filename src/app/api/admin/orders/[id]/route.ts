// src/app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import Razorpay from 'razorpay'
import { z } from 'zod'

// ⚡ REQUEST VALIDATION contract framework mapping
const orderPatchSchema = z.object({
  status: z.string().min(1),
  reason: z.string().optional(),
  courier_name: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const { id } = await params
    const supabase = createAdminClient()

    // 🏛️ SINGLE-PASS FETCH: Secure item snapshots directly without legacy retry conditions
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users!user_id (*),
        address:addresses!address_id (*),
        order_items (
          id,
          quantity,
          price,
          original_price,
          variant_string,
          purchase_type,
          product:products (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order profile parameters not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error in administrative single details lookup:', error)
    return NextResponse.json(
      { error: error.message || 'Internal order retrieval fault compilation failed.' },
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
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'The database rejected this deletion request.' }, 
      { status: 500 }
    )
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
    const rawBody = await request.json()
    
    const parsed = orderPatchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input attributes configuration', details: parsed.error.format() }, { status: 400 })
    }

    const { status, reason, courier_name, tracking_number, tracking_url } = parsed.data
    const supabase = createAdminClient()

    // ─── AUTOMATED B2B/B2C TAX COMPLIANT REFUNDS TRIGGER ───
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
          } catch (refundError: any) {
            console.error('Razorpay Gateway Refund Exception:', refundError)
            return NextResponse.json({ error: `Gateway reversal step execution failed: ${refundError.message}` }, { status: 500 })
          }
        }
      }
    }

    // Assemble payload modifications dynamically
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'cancelled' && reason ? { payment_failed_reason: reason } : {}),
    }

    if (status === 'shipped') {
      updatePayload.courier_name = courier_name || null
      updatePayload.tracking_number = tracking_number || null
      updatePayload.tracking_url = tracking_url || null
      updatePayload.shipped_at = new Date().toISOString()
    }

    const { error: patchError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)

    if (patchError) throw patchError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating order records parameters state:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to modify transaction states inside database rows.' },
      { status: 500 }
    )
  }
}