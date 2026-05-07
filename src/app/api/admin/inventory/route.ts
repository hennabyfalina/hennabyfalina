// src/app/api/admin/inventory/route.ts

import { NextResponse } from 'next/server'
import { updateStock } from '@/services/inventory.service'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const inventoryUpdateSchema = z.object({
  product_id: z.string().min(1),
  stock: z.number().int().nonnegative(),
  reason: z.string().min(1),
  notes: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const rawBody = await req.json()
    const parsed = inventoryUpdateSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
    }

    const { product_id, stock, reason, notes } = parsed.data

    await updateStock(product_id, stock, reason, notes || undefined)
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update stock' }, { status: 500 })
  }
}
