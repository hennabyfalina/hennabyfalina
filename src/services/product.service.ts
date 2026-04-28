// src/services/product.service.ts

'use server'

import { cache } from 'react'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Product } from '@/types/database.types'
import { uploadProductImage, getPublicUrl, deleteProductImage } from '@/lib/supabase/storage'

// Cache for products
let productsCache: Product[] | null = null
let productsWithPublicCache: Product[] | null = null
let lastCacheInvalidation = 0
const CACHE_TTL = 60000 // 1 minute

function isCacheValid(): boolean {
  return Date.now() - lastCacheInvalidation < CACHE_TTL
}

function invalidateCache() {
  productsCache = null
  productsWithPublicCache = null
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
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
  if (error) return []
  if (useCache) productsCache = data || []
  return data || []
})

export const getProductsWithSignedUrls = cache(async (useCache: boolean = true): Promise<Product[]> => {
  if (useCache && productsWithPublicCache && isCacheValid()) return productsWithPublicCache
  const products = await getProducts(useCache)
  const productsWithPublicUrls = addPublicUrls(products)
  if (useCache) productsWithPublicCache = productsWithPublicUrls
  return productsWithPublicUrls
})

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).single()
  if (error) return null
  return data
})

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) return null
  return data
})

export const getProductWithSignedUrls = cache(async (slug: string): Promise<Product | null> => {
  const product = await getProductBySlug(slug)
  if (!product) return null
  const productsWithPublicUrls = addPublicUrls([product])
  return productsWithPublicUrls[0] || null
})

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const supabase = await createServerClient()
  const { images, price, selling_price, bulk_price, bulk_min_quantity, ...rest } = productData
  
  const { data: existing } = await supabase.from('products').select('id').eq('slug', rest.slug).single()
  if (existing) throw new Error(`Product with slug "${rest.slug}" already exists`)
  
  const { data, error } = await supabase
    .from('products')
    .insert({ ...rest, price, selling_price, bulk_price, bulk_min_quantity, images: images || [] })
    .select().single()

  if (error) throw error
  invalidateCache()
  return data
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const supabase = await createServerClient()
  const { images: newImages, price, selling_price, bulk_price, bulk_min_quantity, ...rest } = updates
  
  if (rest.slug) {
    const { data: existing } = await supabase.from('products').select('id').eq('slug', rest.slug).neq('id', id).single()
    if (existing) throw new Error(`Product with slug "${rest.slug}" already exists`)
  }
  
  const { data: currentProduct, error: fetchError } = await supabase.from('products').select('images').eq('id', id).single()
  if (fetchError) throw fetchError
  
  const removedImages = currentProduct?.images?.filter((path: string) => !newImages?.includes(path)) || []
  for (const path of removedImages) {
    try { await deleteProductImage(path) } catch (err) {}
  }
  
  const { data, error } = await supabase
    .from('products')
    .update({ ...rest, price, selling_price, bulk_price, bulk_min_quantity, images: newImages || [], updated_at: new Date().toISOString() })
    .eq('id', id).select().single()

  if (error) throw error
  invalidateCache()
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createServerClient()
  const { data: product } = await supabase.from('products').select('images').eq('id', id).single()
  
  if (product?.images && product.images.length > 0) {
    for (const path of product.images) {
      try { await deleteProductImage(path) } catch (err) {}
    }
  }
  
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
  invalidateCache()
}

export const getProductCount = cache(async (): Promise<number> => {
  const supabase = await createServerClient()
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)
  if (error) return 0
  return count || 0
})

export const getProductsByCategory = cache(async (categoryId: string): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('category_id', categoryId).eq('is_active', true).order('created_at', { ascending: false })
  if (error) return []
  return data || []
})

export const getProductsByCategoryWithSignedUrls = cache(async (categoryId: string): Promise<Product[]> => {
  const products = await getProductsByCategory(categoryId)
  return addPublicUrls(products)
})

export const getFeaturedProducts = cache(async (limit: number = 4): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return data || []
})

export const getFeaturedProductsWithSignedUrls = cache(async (limit: number = 4): Promise<Product[]> => {
  const products = await getFeaturedProducts(limit)
  return addPublicUrls(products)
})

export const getNewArrivals = cache(async (limit: number = 8): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return data || []
})

export const getNewArrivalsWithSignedUrls = cache(async (limit: number = 8): Promise<Product[]> => {
  const products = await getNewArrivals(limit)
  return addPublicUrls(products)
})

// 🚨 SMART FALLBACK: GET RELATED PRODUCTS
export const getRelatedProducts = cache(async (productId: string, categoryId: string | null, limit: number = 6): Promise<Product[]> => {
  const supabase = await createServerClient()
  let related: Product[] = []
  const excludeIds = new Set<string>([productId])

  if (categoryId) {
    const { data } = await supabase
      .from('products').select('*').eq('category_id', categoryId)
      .eq('is_active', true).neq('id', productId).limit(limit)
    if (data) {
      related = data
      data.forEach(p => excludeIds.add(p.id))
    }
  }

  if (related.length < limit) {
    const needed = limit - related.length
    const { data: fillers } = await supabase.from('products').select('*').eq('is_active', true).limit(30)
    if (fillers) {
      const validFillers = fillers.filter(p => !excludeIds.has(p.id))
      const shuffled = validFillers.sort(() => 0.5 - Math.random()).slice(0, needed)
      related = [...related, ...shuffled]
    }
  }
  return related
})

export const getRelatedProductsWithSignedUrls = cache(async (productId: string, categoryId: string | null, limit: number = 6): Promise<Product[]> => {
  const products = await getRelatedProducts(productId, categoryId, limit)
  return addPublicUrls(products)
})

// 🚨 SMART FALLBACK: GET CART RECOMMENDATIONS
export const getCartRecommendations = cache(async (cartProductIds: string[], limit: number = 6): Promise<Product[]> => {
  if (!cartProductIds || cartProductIds.length === 0) return []
  const supabase = await createServerClient()
  const excludeIds = new Set<string>(cartProductIds)
  let recommendations: Product[] = []

  const { data: cartProducts } = await supabase.from('products').select('category_id').in('id', cartProductIds)
  const categoryIds = [...new Set(cartProducts?.map(p => p.category_id).filter(Boolean))]

  if (categoryIds.length > 0) {
    const { data } = await supabase.from('products').select('*').eq('is_active', true).in('category_id', categoryIds as string[]).limit(30)
    if (data) {
      const valid = data.filter(p => !excludeIds.has(p.id))
      recommendations = valid.sort(() => 0.5 - Math.random()).slice(0, limit)
      recommendations.forEach(p => excludeIds.add(p.id))
    }
  }

  if (recommendations.length < limit) {
    const needed = limit - recommendations.length
    const { data: fillers } = await supabase.from('products').select('*').eq('is_active', true).limit(40)
    if (fillers) {
      const validFillers = fillers.filter(p => !excludeIds.has(p.id))
      const shuffled = validFillers.sort(() => 0.5 - Math.random()).slice(0, needed)
      recommendations = [...recommendations, ...shuffled]
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
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).lte('stock', threshold).order('stock', { ascending: true })
  if (error) return []
  return data || []
})

export const getOutOfStockProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('stock', 0).order('created_at', { ascending: false })
  if (error) return []
  return data || []
})

export async function bulkUpdateProductStatus(productIds: string[], status: 'draft' | 'published' | 'archived'): Promise<void> {
  const supabase = await createServerClient()
  const is_active = status === 'published'
  const { error } = await supabase.from('products').update({ is_active, updated_at: new Date().toISOString() }).in('id', productIds)
  if (error) throw error
  invalidateCache()
}

export const searchProducts = cache(async (query: string, limit: number = 100): Promise<Product[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true).or(`name.ilike.%${query}%,description.ilike.%${query}%`).order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return data || []
})

export const searchProductsWithSignedUrls = cache(async (query: string, limit: number = 100): Promise<Product[]> => {
  const products = await searchProducts(query, limit)
  return addPublicUrls(products)
})