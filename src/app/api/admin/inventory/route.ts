// src/app/api/admin/inventory/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// 🏛️ ZERO-TRUST INVENTORY ADJUSTMENT CONTRACT
const inventoryUpdateSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  variant_name: z.string().nullable().optional(), // If provided, mutates JSON slot; if null, mutates root
  change_amount: z.number().int("Change amount must be an integer"), // e.g. +20 or -5
  reason: z.string().min(1, "Reason token is required"),
})

export async function POST(req: NextRequest) {
  try {
    // 1. GATEKEEPER: Administrative authentication guard
    const { authorized, response, user } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    const rawBody = await req.json()
    const parsed = inventoryUpdateSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Malformed inventory input metrics', details: parsed.error.format() }, 
        { status: 400 }
      )
    }

    const { product_id, variant_name, change_amount, reason } = parsed.data
    const supabase = createAdminClient()
    
    // Track previous and new values for the audit log ledger
    let calculatedPreviousStock = 0
    let calculatedNewStock = 0
    let finalReasonToken = reason

    // Fetch the target product to perform delta calculations
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('name, stock, variants')
      .eq('id', product_id)
      .single()

    if (fetchError || !product) throw new Error('Target product element not found.')

    // ─── CASE A: MULTI-VARIANT ARRAY SLOT DELTA MUTATION ───
    if (variant_name) {
      const variantsList = Array.isArray(product.variants) ? [...product.variants] : []
      const targetIndex = variantsList.findIndex((v: any) => v.name === variant_name)

      if (targetIndex === -1) {
        return NextResponse.json({ error: 'Target choice variant option name matching not found.' }, { status: 404 })
      }

      calculatedPreviousStock = Number(variantsList[targetIndex].stock) || 0
      calculatedNewStock = calculatedPreviousStock + change_amount

      if (calculatedNewStock < 0) {
        return NextResponse.json({ error: 'Level drop error: Variant stock cannot be negative.' }, { status: 400 })
      }

      variantsList[targetIndex].stock = calculatedNewStock
      finalReasonToken = `${reason} [Variant: ${variant_name}]`

      // Commit array update payload
      const { error: arrayUpdateError } = await supabase
        .from('products')
        .update({ variants: variantsList, updated_at: new Date().toISOString() })
        .eq('id', product_id)

      if (arrayUpdateError) throw arrayUpdateError

    } else {
      // ─── CASE B: ROOT FLAT COLUMN STOCK DELTA MUTATION ───
      calculatedPreviousStock = Number(product.stock) || 0
      calculatedNewStock = calculatedPreviousStock + change_amount

      if (calculatedNewStock < 0) {
        return NextResponse.json({ error: 'Level drop error: Product stock cannot be negative.' }, { status: 400 })
      }

      // Safe update execution passing calculated delta variables
      const { error: rootUpdateError } = await supabase
        .from('products')
        .update({ 
          stock: calculatedNewStock, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', product_id)

      if (rootUpdateError) throw rootUpdateError
    }

    // 📝 COMMIT TO YOUR REAL INVENTORY_LOGS TABLE MATCHING COLUMNS
    const { error: logError } = await supabase
      .from('inventory_logs')
      .insert({
        product_id,
        user_id: user?.id || null, // Logs the specific editor admin's user ID
        previous_stock: calculatedPreviousStock,
        new_stock: calculatedNewStock,
        change_amount: change_amount,
        reason: finalReasonToken,
        checkout_session_id: null, // Only used when automated by stripe webhooks
        created_at: new Date().toISOString()
      })

    if (logError) throw logError

    // 🚨 CO-FOUNDER SMART MOVE: AUTOMATED INVENTORY ALERTS TRIGGER MECHANISM
    // Look up if an active threshold baseline is mapped inside inventory_alerts for this product
    const { data: activeAlert, error: alertFetchError } = await supabase
      .from('inventory_alerts')
      .select('id, threshold')
      .eq('product_id', product_id)
      .maybeSingle()

    if (!alertFetchError && activeAlert) {
      const currentThreshold = activeAlert.threshold
      let newAlertStatus = 'healthy'

      if (calculatedNewStock === 0) {
        newAlertStatus = 'out_of_stock'
      } else if (calculatedNewStock <= currentThreshold) {
        newAlertStatus = 'low_stock'
      }

      // If status shifted to low or out, overwrite the alert dashboard tracking row
      await supabase
        .from('inventory_alerts')
        .update({
          current_stock: calculatedNewStock,
          status: newAlertStatus,
          resolved_at: newAlertStatus === 'healthy' ? new Date().toISOString() : null
        })
        .eq('id', activeAlert.id)
    }

    return NextResponse.json({ success: true, new_stock: calculatedNewStock })

  } catch (error: any) {
    console.error('Inventory log engine exception:', error)
    return NextResponse.json(
      { error: error.message || 'Ledger runtime adjustment exception failed.' }, 
      { status: 500 }
    )
  }
}