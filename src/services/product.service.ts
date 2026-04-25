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

// Helper to convert image paths to public URLs
function addPublicUrls(products: Product[]): Product[] {
  return products.map(product => ({
    ...product,
    images: product.images?.map(path => {
      // If already a full URL, return as is
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path
      }
      // If no image path or empty, return placeholder
      if (!path || path === '') {
        return '/placeholder-product.svg'
      }
      // Convert storage path to public URL
      return getPublicUrl(path)
    }) || []
  }))
}

// Fetch all active products (returns storage paths)
export const getProducts = cache(async (useCache: boolean = true): Promise<Product[]> => {
  if (useCache && productsCache && isCacheValid()) {
    return productsCache
  }
  
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  if (useCache) {
    productsCache = data || []
  }
  
  return data || []
})

// Fetch all active products with public URLs for images
export const getProductsWithSignedUrls = cache(async (useCache: boolean = true): Promise<Product[]> => {
  // Renamed function for backward compatibility, now returns public URLs
  if (useCache && productsWithPublicCache && isCacheValid()) {
    return productsWithPublicCache
  }
  
  const products = await getProducts(useCache)
  const productsWithPublicUrls = addPublicUrls(products)

  if (useCache) {
    productsWithPublicCache = productsWithPublicUrls
  }
  
  return productsWithPublicUrls
})

// Fetch a single product by slug (returns with storage paths)
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product by slug:', error)
    return null
  }

  return data
})

// Fetch a single product by ID
export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product by ID:', error)
    return null
  }

  return data
})

// Fetch a single product with public URLs for images
export const getProductWithSignedUrls = cache(async (slug: string): Promise<Product | null> => {
  // Renamed for backward compatibility, now returns public URLs
  const product = await getProductBySlug(slug)
  if (!product) return null

  const productsWithPublicUrls = addPublicUrls([product])
  return productsWithPublicUrls[0] || null
})

// Create a new product
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const supabase = await createServerClient()
  
  const { images, price, selling_price, bulk_price, bulk_min_quantity, ...rest } = productData
  
  // Check if slug already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', rest.slug)
    .single()
  
  if (existing) {
    throw new Error(`Product with slug "${rest.slug}" already exists`)
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...rest,
      price,
      selling_price,
      bulk_price,
      bulk_min_quantity,
      images: images || [], // store paths as they are (temp paths)
    })
    .select()
    .single()

  if (error) throw error

  // Invalidate cache
  invalidateCache()
  
  return data
}

// Update an existing product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const supabase = await createServerClient()
  
  // Extract image paths to handle deletion/movement
  const { images: newImages, price, selling_price, bulk_price, bulk_min_quantity, ...rest } = updates
  
  // If updating slug, check uniqueness
  if (rest.slug) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', rest.slug)
      .neq('id', id)
      .single()
    
    if (existing) {
      throw new Error(`Product with slug "${rest.slug}" already exists`)
    }
  }
  
  // First get the current product to compare image paths
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('images')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Determine which images were removed
  const removedImages = currentProduct?.images?.filter(
    (path: string) => !newImages?.includes(path)
  ) || []
  
  // Delete removed images from storage
  for (const path of removedImages) {
    try {
      await deleteProductImage(path)
    } catch (err) {
      console.error(`Failed to delete image ${path}:`, err)
    }
  }
  
  // Use new images as they are (already uploaded to temp/)
  const updatedImages = newImages || []
  
  const { data, error } = await supabase
    .from('products')
    .update({
      ...rest,
      price,
      selling_price,
      bulk_price,
      bulk_min_quantity,
      images: updatedImages,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  
  // Invalidate cache
  invalidateCache()
  
  return data
}

// Delete a product and its images from storage
export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createServerClient()
  
  // First get the product to know which images to delete
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('images')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Delete all images from storage
  if (product?.images && product.images.length > 0) {
    for (const path of product.images) {
      try {
        await deleteProductImage(path)
      } catch (err) {
        console.error(`Failed to delete image ${path}:`, err)
      }
    }
  }
  
  // Delete the product record
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // Invalidate cache
  invalidateCache()
}

// Get product count
export const getProductCount = cache(async (): Promise<number> => {
  const supabase = await createServerClient()
  
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  if (error) {
    console.error('Error counting products:', error)
    return 0
  }
  
  return count || 0
})

// Get products by category
export const getProductsByCategory = cache(async (categoryId: string): Promise<Product[]> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by category:', error)
    return []
  }

  return data || []
})

// Get products with public URLs by category
export const getProductsByCategoryWithSignedUrls = cache(async (categoryId: string): Promise<Product[]> => {
  // Renamed for backward compatibility, now returns public URLs
  const products = await getProductsByCategory(categoryId)
  return addPublicUrls(products)
})

// Get featured products (for homepage)
export const getFeaturedProducts = cache(async (limit: number = 4): Promise<Product[]> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data || []
})

// Get featured products with public URLs
export const getFeaturedProductsWithSignedUrls = cache(async (limit: number = 4): Promise<Product[]> => {
  // Renamed for backward compatibility, now returns public URLs
  const products = await getFeaturedProducts(limit)
  return addPublicUrls(products)
})

// Get new arrivals (latest products)
export const getNewArrivals = cache(async (limit: number = 8): Promise<Product[]> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching new arrivals:', error)
    return []
  }

  return data || []
})

// Get new arrivals with public URLs
export const getNewArrivalsWithSignedUrls = cache(async (limit: number = 8): Promise<Product[]> => {
  // Renamed for backward compatibility, now returns public URLs
  const products = await getNewArrivals(limit)
  return addPublicUrls(products)
})

// Get related products (same category, excluding current)
export const getRelatedProducts = cache(async (productId: string, categoryId: string | null, limit: number = 4): Promise<Product[]> => {
  if (!categoryId) return []
  
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .neq('id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related products:', error)
    return []
  }

  return data || []
})

// Get related products with public URLs
export const getRelatedProductsWithSignedUrls = cache(async (productId: string, categoryId: string | null, limit: number = 4): Promise<Product[]> => {
  // Renamed for backward compatibility, now returns public URLs
  const products = await getRelatedProducts(productId, categoryId, limit)
  return addPublicUrls(products)
})

// Helper to get a public URL for a single image path (for client-side use)
export async function getProductImageUrl(path: string): Promise<string | null> {
  return getPublicUrl(path)
}

// Get low stock products (stock <= threshold)
export const getLowStockProducts = cache(async (threshold: number = 10): Promise<Product[]> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .lte('stock', threshold)
    .order('stock', { ascending: true })

  if (error) {
    console.error('Error fetching low stock products:', error)
    return []
  }

  return data || []
})

// Get out of stock products
export const getOutOfStockProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('stock', 0)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching out of stock products:', error)
    return []
  }

  return data || []
})

// Bulk update product status
export async function bulkUpdateProductStatus(productIds: string[], status: 'draft' | 'published' | 'archived'): Promise<void> {
  const supabase = await createServerClient()
  
  const is_active = status === 'published'
  
  const { error } = await supabase
    .from('products')
    .update({ is_active, updated_at: new Date().toISOString() })
    .in('id', productIds)
  
  if (error) throw error
  
  // Invalidate cache
  invalidateCache()
}

// Search products by name or description
export const searchProducts = cache(async (query: string, limit: number = 100): Promise<Product[]> => {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data || []
})

// Search products with public URLs
export const searchProductsWithSignedUrls = cache(async (query: string, limit: number = 100): Promise<Product[]> => {
  // Renamed for backward compatibility, now returns public URLs
  const products = await searchProducts(query, limit)
  return addPublicUrls(products)
})