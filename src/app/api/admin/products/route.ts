// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Define the exact shape and requirements for a new product
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  selling_price: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  category_id: z.string().nullable().optional().or(z.literal('').transform(() => null)),
  images: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  sku: z.string().nullable().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  weight_unit: z.enum(['kg', 'g']).nullable().optional(), 
  dimensions: z.any().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  review_count: z.number().int().nonnegative().nullable().optional(),
  frequently_bought_together: z.array(z.string()).optional(),
})

export async function GET() {
  const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) return response!

  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) return response!

  const supabase = await createClient()
  const rawBody = await request.json()
  
  // Validate & Strip extra fields
  const parsed = productSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('products')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}