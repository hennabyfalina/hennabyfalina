// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  category_id: z.string().nullable().optional().or(z.literal('').transform(() => null)),
  images: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  
  // 🏛️ UPDATE BOUNDARY MODES FLAGS
  is_retail_enabled: z.boolean().optional(),
  is_wholesale_enabled: z.boolean().optional(),
  is_variants_enabled: z.boolean().optional(),

  // 🎯 ATOMIC PRICING INPUT MATRIX
  retail_price: z.number().nonnegative().optional(),
  wholesale_price: z.number().nonnegative().nullable().optional(),
  wholesale_min_qty: z.number().int().nonnegative().nullable().optional(),
  mrp: z.number().nonnegative().nullable().optional(),

  weight: z.number().nullable().optional(),
  weight_unit: z.string().nullable().optional(),
  gsm: z.number().nullable().optional(),
  dimensions: z.object({
    length: z.number().nonnegative(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative()
  }).nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  variants: z.any().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const { id } = await params
    const supabase = createAdminClient()
    const rawBody = await request.json()
    
    const parsed = productUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation parameters structure failure', details: parsed.error.format() }, { status: 400 })
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error('Error handling product alteration pipeline updates:', error)
    return NextResponse.json({ error: error.message || 'The network mutation state execution failed.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Super Admin gatekeeper validation
    const { authorized, response } = await verifyAdmin(['super_admin'])
    if (!authorized) return response!

    const { id } = await params
    const supabase = createAdminClient()

    // 🛡️ SOFT DELETION ARCHITECTURE: Protects past relational purchase paths
    const { error } = await supabase
      .from('products')
      .update({
        is_deleted: true,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error soft-deleting catalog element node:', error)
    return NextResponse.json({ error: error.message || 'Archival pipeline configuration rejected.' }, { status: 500 })
  }
}