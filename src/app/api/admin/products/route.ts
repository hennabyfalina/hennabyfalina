// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// 🏛️ ZERO-TRUST CATALOG SCHEMA VALIDATION CONTRACT
const productSchema = z.object({
  name: z.string().min(1, "Product name token context is required"),
  slug: z.string().min(1, "URL reference path token is required"),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  stock: z.number().int().nonnegative("Inventory parameters must be non-negative"),
  category_id: z.string().nullable().optional().or(z.literal('').transform(() => null)),
  images: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),

  // 🏛️ STRATEGIC MODES FEATURE FLAGS
  is_retail_enabled: z.boolean().optional().default(true),
  is_wholesale_enabled: z.boolean().optional().default(false),
  is_variants_enabled: z.boolean().optional().default(false),

  // 🎯 HYBRID MATRIX PRICING RE-CALIBRATION CORE
  retail_price: z.number().nonnegative().default(0),
  wholesale_price: z.number().nonnegative().nullable().optional(),
  wholesale_min_qty: z.number().int().nonnegative().nullable().optional(),
  mrp: z.number().nonnegative().nullable().optional().default(0),
  
  weight: z.number().nullable().optional(),
  weight_unit: z.string().nullable().optional().default('g'),
  gsm: z.number().nullable().optional(),
  dimensions: z.object({
    length: z.number().nonnegative(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative()
  }).nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  variants: z.any().nullable().optional(), // Dynamic variation layout mapping
})

export async function GET() {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const supabase = await createClient()
    
    // 🛡️ ARCHIVE SHIELD: Excludes soft-deleted products from the dashboard view
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(products || [])
  } catch (error: any) {
    console.error('Error fetching admin products collection ledger:', error)
    return NextResponse.json({ error: error.message || 'Failed to retrieve catalog metadata properties.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const supabase = await createClient()
    const rawBody = await request.json()
    
    const parsed = productSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid schema structural attributes', details: parsed.error.format() }, { status: 400 })
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        ...parsed.data,
        is_deleted: false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(newProduct)
  } catch (error: any) {
    console.error('Error creating new product entity row:', error)
    return NextResponse.json({ error: error.message || 'Failed to commit item configuration parameters.' }, { status: 500 })
  }
}