// src/app/api/admin/customers/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const customerPatchSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
}).passthrough()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const { id } = await params
    const rawBody = await request.json()
    const parsed = customerPatchSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { name, phone, id: _droppedId, ...addressData } = parsed.data

    const { data, error } = await adminSupabase
      .from('users')
      .update({ name, phone: phone || null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update or insert addresses seamlessly
    if (addressData.address_line1 || addressData.city || addressData.state) {
      const { data: existingAddress } = await adminSupabase.from('addresses').select('id').eq('user_id', id).limit(1)
      if (existingAddress && existingAddress.length > 0) {
        await adminSupabase.from('addresses').update(addressData).eq('id', existingAddress[0].id)
      } else {
        await adminSupabase.from('addresses').insert({
          user_id: id,
          name: name || data?.name,
          phone: phone || data?.phone,
          ...addressData,
          is_default: true,
          delivery_method: 'delivery'
        })
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 })
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
    const adminSupabase = createAdminClient()
    
    // Deleting from auth.users cascades to public.users automatically!
    const { error } = await adminSupabase.auth.admin.deleteUser(id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 })
  }
}
