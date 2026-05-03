// src/app/api/admin/customers/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()
    const { name, email, phone, ...addressData } = parsed.data

    // Note: If you have a different schema (e.g. keeping addresses in a separate table), 
    // adjust this insert logic to match your database structure.
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        role: 'customer'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 })
  }
}
