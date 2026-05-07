// src/app/api/admin/customers/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const rawBody = await request.json()
    const parsed = customerSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { name, email, phone, ...addressData } = parsed.data

    // 1. Create secure Auth User via Admin API
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: email || undefined,
      phone: phone || undefined,
      email_confirm: true,
      user_metadata: { name, role: 'customer' }
    })

    if (authError) throw authError
    const userId = authData.user.id

    // 2. Ensure public users table is updated (in case triggers lag)
    await adminSupabase.from('users').update({ name, phone: phone || null }).eq('id', userId)

    // 3. Insert address records if provided
    if (addressData.address_line1 || addressData.city) {
      await adminSupabase.from('addresses').insert({
        user_id: userId,
        name,
        phone: phone || null,
        ...addressData,
        is_default: true,
        delivery_method: 'delivery'
      })
    }

    return NextResponse.json({ id: userId, name, email })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 })
  }
}
