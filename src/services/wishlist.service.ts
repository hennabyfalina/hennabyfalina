// src/services/wishlist.service.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { getPublicUrl } from './product.service'
import { z } from 'zod'

const toggleWishlistSchema = z.object({
  productId: z.string().uuid("Invalid product unique tracking key format")
})

export async function toggleWishlistItem(productId: string) {
  try {
    const parsed = toggleWishlistSchema.safeParse({ productId })
    if (!parsed.success) return { success: false, error: 'Invalid product ID' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'unauthorized' }
    }

    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', parsed.data.productId)
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase.from('wishlists').delete().eq('id', existing.id)
      if (error) throw error
      return { success: true, added: false }
    } else {
      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: parsed.data.productId })
      if (error) throw error
      return { success: true, added: true }
    }
  } catch (error: any) {
    console.error('Wishlist toggle error:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserWishlistIds() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching wishlist IDs:', error)
    return []
  }

  return data.map(item => item.product_id)
}

export async function getFullWishlist() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  // 🏛️ ZERO-TRUST PARITY JOIN: Pull all multi-mode flags and metadata arrays to fulfill ProductCard schemas
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      id,
      product_id,
      products (
        id, 
        name, 
        slug, 
        sku,
        description,
        retail_price, 
        wholesale_price, 
        wholesale_min_qty,
        mrp,
        stock, 
        images,
        rating, 
        review_count,
        variants,
        is_active,
        is_deleted,
        is_retail_enabled,
        is_wholesale_enabled,
        is_variants_enabled
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching full wishlist:', error)
    return []
  }

  // Optimize execution by performing direct synchronous string lookups inside the loop array map
  const formattedWishlist = (data || [])
    .filter((item: any) => item.products !== null && !item.products.is_deleted && item.products.is_active)
    .map((item: any) => {
      const product = item.products
      const rawImage = product.images?.[0]
      const imageUrl = rawImage ? getPublicUrl(rawImage) : '/placeholder-product.svg'
      
      return {
        wishlist_id: item.id,
        product: {
          ...product,
          images: product.images?.map((path: string) => getPublicUrl(path)) || []
        }
      }
    })

  return formattedWishlist
}