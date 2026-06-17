// src/services/product.service.ts

'use server'

import { cache } from 'react'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Product } from '@/types/database.types'
import { getPublicUrl, deleteProductImage } from '@/lib/supabase/storage'
import { verifyAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const productMutationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  stock: z.number().int().nonnegative(),
  category_id: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  
  // 🏛️ STRATEGIC PRODUCT MODES FLAGS
  is_retail_enabled: z.boolean().optional().default(true),
  is_wholesale_enabled: z.boolean().optional().default(false),
  is_variants_enabled: z.boolean().optional().default(false),

  // 🎯 UNIFIED PRICE CORE
  retail_price: z.number().nonnegative().default(0),
  wholesale_price: z.number().nonnegative().nullable().optional(),
  wholesale_min_qty: z.number().int().nonnegative().nullable().optional(),
  mrp: z.number().nonnegative().nullable().optional().default(0),
  variants: z.any().nullable().optional(), // Visual matrix array serialized text mapping
  
  weight: z.number().nullable().optional(),
  weight_unit: z.string().nullable().optional().default('kg'),
  gsm: z.number().nullable().optional(),
  dimensions: z.any().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
  rating: z.number().min(0).max(5).nullable().optional().default(4.5),
  review_count: z.number().int().nonnegative().nullable().optional().default(0),
  frequently_bought_together: z.array(z.string().uuid()).optional().default([]),
  is_featured: z.boolean().optional().default(false),
})

let productsCache: Product[] | null = null
let lastCacheInvalidation = 0
const CACHE_TTL = 60000 

function isCacheValid(): boolean {
  return Date.now() - lastCacheInvalidation < CACHE_TTL
}

function invalidateCache() {
  productsCache = null
  lastCacheInvalidation = Date.now()
}

function addPublicUrls(products: Product[]): Product[] {
  return products.map(product => ({
    ...product,
    images: product.images?.map(path => {
      if (path.startsWith('http://') || path.startsWith('https://')) return path
      if (!path || path === '') return '/placeholder-product.svg'
      return getPublicUrl(path)
    }) || []
  }))
}

export const getProducts = cache(async (useCache: boolean = true): Promise<Product[]> => {
  if (useCache && productsCache && isCacheValid()) return productsCache
  
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) return []

  if (useCache) productsCache = data as Product[]
  return data as Product[]
})

export const getProductsWithSignedUrls = cache(async (useCache: boolean = true): Promise<Product[]> => {
  const products = await getProducts(useCache)
  return addPublicUrls(products)
})

export async function getRecentlyBoughtProductsForUser(userId: string, limit: number = 8): Promise<Product[]> {
  const supabase = await createServerClient()
  const { data: ordersData, error: ordersError } = await supabase.from('orders').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
  if (ordersError || !ordersData.length) return []
  const orderIds = ordersData.map(order => order.id)

  const { data: orderItemsData, error: orderItemsError } = await supabase.from('order_items').select('product_id').in('order_id', orderIds).order('created_at', { ascending: false })
  if (orderItemsError || !orderItemsData?.length) return []

  const uniqueProductIds = Array.from(new Set(orderItemsData.map(item => item.product_id)))
  return await getProductsByIdsWithSignedUrls(uniqueProductIds.slice(0, limit))
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createServerClient()
  const decodedSlug = decodeURIComponent(slug)

  const { data, error } = await supabase
    .from('products')
    .select('*') 
    .eq('slug', decodedSlug)
    .eq('is_deleted', false)
    .limit(1)
    
  if (error) {
    console.error(`🚨 SUPABASE ERROR FOR SLUG [${decodedSlug}]:`, error)
    return null
  }

  if (!data || data.length === 0) return null
  
  return data[0] as Product
})

export const getProductWithSignedUrls = cache(async (slug: string): Promise<Product | null> => {
  const product = await getProductBySlug(slug)
  if (!product) return null
  const productsWithPublicUrls = addPublicUrls([product])
  return productsWithPublicUrls[0] || null
})

export async function getProductsByIdsWithSignedUrls(productIds: string[]): Promise<Product[]> {
  if (!productIds || productIds.length === 0) return []
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').in('id', productIds).eq('is_deleted', false)
  if (error) return []
  return addPublicUrls(data as Product[] || [])
}

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*') 
    .eq('id', id)
    .eq('is_deleted', false)
    .limit(1)
    
  if (error) {
    console.error(`🚨 SUPABASE ERROR FOR PRODUCT ID [${id}]:`, error)
    return null
  }

  if (!data || data.length === 0) return null

  return data[0] as Product
})

export async function createProduct(productData: any): Promise<Product> {
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized')

  const parsed = productMutationSchema.parse(productData)
  const supabase = await createServerClient()
  
  const { images, ...rest } = parsed
  
  const { data: existing } = await supabase.from('products').select('id').eq('slug', rest.slug).limit(1).maybeSingle()
  if (existing) throw new Error(`Product with slug "${rest.slug}" already exists`)
  
  const { data, error } = await supabase
    .from('products')
    .insert({ ...rest, images: images || [] } as any)
    .select().single()

  if (error) throw error

  invalidateCache()
  return data as Product
}

export async function updateProduct(id: string, updates: any): Promise<Product> {
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized')

  const parsed = productMutationSchema.partial().parse(updates)
  const supabase = await createServerClient()
  const { images: newImages, ...rest } = parsed
  
  if (rest.slug) {
    const { data: existing } = await supabase.from('products').select('id').eq('slug', rest.slug).neq('id', id).limit(1).maybeSingle()
    if (existing) throw new Error(`Product with slug "${rest.slug}" already exists`)
  }
  
  const { data: currentProduct, error: fetchError } = await supabase.from('products').select('images').eq('id', id).limit(1).maybeSingle()
  if (fetchError) throw fetchError
  
  const removedImages = currentProduct?.images?.filter((path: string) => !newImages?.includes(path)) || []
  for (const path of removedImages) {
    try { 
      await deleteProductImage(path) 
    } catch (err) {
      console.warn(`[Cleanup] Failed to delete old image ${path}:`, err)
    }
  }
  
  const { data, error } = await supabase
    .from('products')
    .update({ ...rest, images: newImages || [], updated_at: new Date().toISOString() } as any)
    .eq('id', id).select().single()

  if (error) throw error

  invalidateCache()
  return data as Product
}

export async function deleteProduct(id: string): Promise<void> {
  const { authorized } = await verifyAdmin(['super_admin'])
  if (!authorized) throw new Error('Forbidden. Super Admin access required.')

  const supabase = await createServerClient()
  const { error } = await supabase.from('products').update({ is_deleted: true, is_active: false }).eq('id', id)
  if (error) throw error
  invalidateCache()
}

export async function restoreProduct(id: string): Promise<void> {
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized')

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('products')
    .update({ is_deleted: false, is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  invalidateCache()
}

export const getProductCount = cache(async (): Promise<number> => {
  const supabase = await createServerClient()
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_deleted', false)
  if (error) return 0
  return count || 0
})

export const getProductsByCategory = cache(async (categoryId: string): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('category_id', categoryId).eq('is_active', true).eq('is_deleted', false).order('created_at', { ascending: false })
  if (error) return []
  return data as Product[] || []
})

export const getProductsByCategoryWithSignedUrls = cache(async (categoryId: string): Promise<Product[]> => {
  const products = await getProductsByCategory(categoryId)
  return addPublicUrls(products)
})

export const getFeaturedProducts = cache(async (limit: number = 4): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).eq('is_deleted', false).order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return data as Product[] || []
})

export const getFeaturedProductsWithSignedUrls = cache(async (limit: number = 4): Promise<Product[]> => {
  const products = await getFeaturedProducts(limit)
  return addPublicUrls(products)
})

export const getNewArrivals = cache(async (limit: number = 8): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_deleted', false).order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return data as Product[] || []
})

export const getNewArrivalsWithSignedUrls = cache(async (limit: number = 8): Promise<Product[]> => {
  const products = await getNewArrivals(limit)
  return addPublicUrls(products)
})

export const getRelatedProducts = cache(async (productId: string, categoryId: string | null, limit: number = 6): Promise<Product[]> => {
  const supabase = await createServerClient()
  let related: Product[] = []
  const excludeIds = new Set<string>([productId])

  if (categoryId) {
    const { data } = await supabase.from('products').select('*').eq('category_id', categoryId).eq('is_active', true).eq('is_deleted', false).neq('id', productId).limit(limit)
    if (data) {
      related = data as Product[]
      data.forEach(p => excludeIds.add(p.id))
    }
  }

  if (related.length < limit) {
    const needed = limit - related.length
    const { data: fillers } = await supabase.from('products').select('*').eq('is_active', true).eq('is_deleted', false).limit(30)
    if (fillers) {
      const validFillers = fillers.filter(p => !excludeIds.has(p.id))
      const shuffled = validFillers.sort(() => 0.5 - Math.random()).slice(0, needed)
      related = [...related, ...(shuffled as Product[])]
    }
  }
  return related
})

export const getRelatedProductsWithSignedUrls = cache(async (productId: string, categoryId: string | null, limit: number = 6): Promise<Product[]> => {
  const products = await getRelatedProducts(productId, categoryId, limit)
  return addPublicUrls(products)
})

export const getCartRecommendations = cache(async (cartProductIds: string[], limit: number = 6): Promise<Product[]> => {
  if (!cartProductIds || cartProductIds.length === 0) return []
  const supabase = await createServerClient()
  const excludeIds = new Set<string>(cartProductIds)
  let recommendations: Product[] = []

  const { data: cartProducts } = await supabase.from('products').select('category_id').in('id', cartProductIds)
  const categoryIds = [...new Set(cartProducts?.map(p => p.category_id).filter(Boolean))]

  if (categoryIds.length > 0) {
    const { data } = await supabase.from('products').select('*').eq('is_active', true).eq('is_deleted', false).in('category_id', categoryIds as string[]).limit(30)
    if (data) {
      const valid = data.filter(p => !excludeIds.has(p.id))
      recommendations = valid.sort(() => 0.5 - Math.random()).slice(0, limit) as Product[]
      recommendations.forEach(p => excludeIds.add(p.id))
    }
  }

  if (recommendations.length < limit) {
    const needed = limit - recommendations.length
    const { data: fillers } = await supabase.from('products').select('*').eq('is_active', true).eq('is_deleted', false).limit(40)
    if (fillers) {
      const validFillers = fillers.filter(p => !excludeIds.has(p.id))
      const shuffled = validFillers.sort(() => 0.5 - Math.random()).slice(0, needed)
      recommendations = [...recommendations, ...(shuffled as Product[])]
    }
  }
  return recommendations
})

export const getCartRecommendationsWithSignedUrls = cache(async (cartProductIds: string[], limit: number = 6): Promise<Product[]> => {
  const products = await getCartRecommendations(cartProductIds, limit)
  return addPublicUrls(products)
})

export async function getProductImageUrl(path: string): Promise<string | null> {
  return getPublicUrl(path)
}

export const getLowStockProducts = cache(async (threshold: number = 10): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_deleted', false).lte('stock', threshold).order('stock', { ascending: true })
  if (error) return []
  return data as Product[] || []
})

export const getOutOfStockProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_deleted', false).eq('stock', 0).order('created_at', { ascending: false })
  if (error) return []
  return data as Product[] || []
})

export const searchProducts = cache(async (query: string, limit: number = 100): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*') 
    .eq('is_active', true)
    .eq('is_deleted', false)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return data as Product[]
})

export const searchProductsWithSignedUrls = cache(async (query: string, limit: number = 100): Promise<Product[]> => {
  const products = await searchProducts(query, limit)
  return addPublicUrls(products)
})

export { getPublicUrl }
