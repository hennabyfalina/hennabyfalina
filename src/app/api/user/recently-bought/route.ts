// src/app/api/user/recently-bought/route.ts

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getRecentlyBoughtProductsForUser } from '@/services/product.service'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    // 1. GATEKEEPER: Enforce strict secure context authentication checks
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized profile access prohibited.' }, { status: 401 })
    }

    // 2. DATA EXTRACTION: Fetch products via the service layer
    const products = await getRecentlyBoughtProductsForUser(user.id)
    
    // Explicitly map properties to match the database types schema
    const verifiedProducts = (products || []).map(product => ({
      ...product,
      is_retail_enabled: product.is_retail_enabled ?? true,
      is_wholesale_enabled: product.is_wholesale_enabled ?? false,
      is_variants_enabled: product.is_variants_enabled ?? false
    }))

    return NextResponse.json(verifiedProducts)
  } catch (error: any) {
    console.error('API Error fetching recently bought products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to extract recent transaction line profiles cleanly.' }, 
      { status: 500 }
    )
  }
}