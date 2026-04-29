// src/app/api/user/recently-bought/route.ts

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getRecentlyBoughtProductsForUser } from '@/services/product.service'

export async function GET(request: Request) {
  const supabase = await createServerClient()

  // Get the user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await getRecentlyBoughtProductsForUser(user.id)
    return NextResponse.json(products)
  } catch (error) {
    console.error('API Error fetching recently bought products:', error)
    return NextResponse.json({ error: 'Failed to fetch recently bought products' }, { status: 500 })
  }
}
