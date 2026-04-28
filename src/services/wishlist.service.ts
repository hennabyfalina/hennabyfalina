// src/services/wishlist.service.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { getProductImageUrl } from './product.service'

export async function toggleWishlistItem(productId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 🚨 SAFE RETURN instead of crashing the server action
      return { success: false, error: 'unauthorized' }
    }

    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existing) {
      const { error } = await supabase.from('wishlists').delete().eq('id', existing.id)
      if (error) throw error
      return { success: true, added: false }
    } else {
      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })
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

  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      id,
      product_id,
      products (
        id, name, slug, price, selling_price, images, stock, rating, review_count
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching full wishlist:', error)
    return []
  }

  const formattedWishlist = await Promise.all(
    (data || []).map(async (item: any) => {
      const product = item.products
      const imageUrl = product.images?.[0] ? await getProductImageUrl(product.images[0]) : null
      
      return {
        wishlist_id: item.id,
        product: {
          ...product,
          image: imageUrl || '/placeholder-product.svg'
        }
      }
    })
  )

  return formattedWishlist
}