// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// 🚨 FIX: Only the new schema runs.
const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  selling_price: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  category_id: z.string().nullable().optional().or(z.literal('').transform(() => null)),
  images: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  sku: z.string().nullable().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  dimensions: z.any().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  review_count: z.number().int().nonnegative().nullable().optional(),
  frequently_bought_together: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  weight_unit: z.enum(['kg', 'g']).nullable().optional(),
  gsm: z.number().nonnegative().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) return response!

  const rawBody = await request.json()
  
  // Validate & Strip extra fields
  const parsed = productUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { authorized, response } = await verifyAdmin(['super_admin'])
  if (!authorized) return response!

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}