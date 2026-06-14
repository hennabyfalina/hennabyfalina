// src/services/category.service.ts

'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { getPublicUrl, deleteProductImage } from '@/lib/supabase/storage'
import { z } from 'zod'
import { verifyAdmin } from '@/lib/admin-auth'
import { revalidateTag } from 'next/cache'

export interface Category {
  meta_title: string
  meta_description: string
  id: string
  category_id?: string | null
  parent_id?: string | null
  name: string
  slug: string
  sku?: string | null
  description?: string | null
  image?: string | null
  retail_price: number
  wholesale_price: number
  wholesale_min_qty: number
  stock: number
  images?: string[]
  is_deleted: boolean
  is_featured: boolean
  rating: number
  review_count: number
  frequently_bought_together?: string[]
  mrp: number
  weight?: number | null
  weight_unit?: string | null
  gsm?: number | null
  dimensions?: any | null
  low_stock_threshold: number
  display_order: number
  is_active: boolean
  product_count?: number
  created_at: string
  updated_at: string
}

// ⚡ HIGH-PERFORMANCE EDGE CACHING FETCH ENGINE
async function fetchFromEdge(queryString: string, cacheTag: string): Promise<any[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!baseUrl || !anonKey) {
    console.error('[Edge Cache Error] Supabase environment keys are missing.')
    return []
  }

  try {
    const response = await fetch(
      `${baseUrl}/rest/v1/categories?${queryString}`,
      {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        next: {
          revalidate: 3600, // ⚡ Store publicly on Vercel's global CDN nodes for 1 hour
          tags: [cacheTag]  // Cache tag pointer for instant, on-demand purges
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Edge Cache Error] Status: ${response.status}, Body: ${errorText}`)
      throw new Error(`CDN response was not OK: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('[Edge CDN Bypass] Fetch error falling back:', error)
    return []
  }
}

// Helper to convert category image path to public URL
function addPublicUrlToCategory<T extends Category>(category: T): T {
  if (!category.image) return category
  return {
    ...category,
    image: getPublicUrl(category.image)
  }
}

function addPublicUrlsToCategories<T extends Category>(categories: T[]): T[] {
  return categories.map(cat => addPublicUrlToCategory(cat))
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

// Fetch all categories with product counts
export async function getCategoriesWithCounts(useCache: boolean = true): Promise<Category[]> {
  // Pull structured datasets through our new edge caching engine
  const queryString = 'select=*,products:products(count)&order=display_order.asc'
  const categories = await fetchFromEdge(queryString, 'categories-with-counts')

  const result = categories.map(cat => ({
    ...cat,
    product_count: cat.products?.[0]?.count || 0
  })) || []

  return addPublicUrlsToCategories(result)
}

// Fetch all categories (without counts)
export async function getCategories(useCache: boolean = true): Promise<Category[]> {
  const queryString = 'select=*&order=display_order.asc'
  const data = await fetchFromEdge(queryString, 'categories-list')
  return addPublicUrlsToCategories(data || [])
}

// Get a single category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching category by ID:', error)
    return null
  }
  
  return data ? addPublicUrlToCategory(data) : null
}

// Get a single category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('Error fetching category by slug:', error)
    return null
  }
  
  return data ? addPublicUrlToCategory(data) : null
}

// Get category tree (hierarchy)
export async function getCategoryTree(): Promise<Category[]> {
  const categories = await getCategories()
  
  // Build tree
  const categoryMap = new Map<string, Category & { children?: Category[] }>()
  const roots: (Category & { children?: Category[] })[] = []
  
  // First pass: create map
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })
  
  // Second pass: build hierarchy
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parent = categoryMap.get(cat.parent_id)
      parent?.children?.push(node!)
    } else {
      roots.push(node!)
    }
  })
  
  return roots
}

// Create category
export async function createCategory(data: {
  name: string
  slug: string
  description?: string
  image?: string | null
  parent_id?: string | null
  is_active?: boolean
}): Promise<Category> {
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized')

  const parsed = categorySchema.parse(data)

  const supabase = await createServerClient()
  
  // Check if slug already exists
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', parsed.slug)
    .single()
  
  if (existing) {
    throw new Error(`Category with slug "${parsed.slug}" already exists`)
  }
  
  // Get max display_order for new category
  const { data: maxOrder } = await supabase
    .from('categories')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single()
  
  const newDisplayOrder = (maxOrder?.display_order ?? -1) + 1
  
  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      image: parsed.image,
      parent_id: parsed.parent_id,
      is_active: parsed.is_active ?? true,
      display_order: newDisplayOrder
    })
    .select()
    .single()
  
  if (error) throw error
  
  // ⚡ FLASH CDN REFRESH: Purges cache across global data hubs instantly on admin update
  revalidateTag('categories-list', 'default')
  revalidateTag('categories-with-counts', 'default')
  
  return addPublicUrlToCategory(category)
}

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

// Update category
export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category> {
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized')

  const parsed = categoryUpdateSchema.parse(updates)
  const supabase = await createServerClient()
  
  // If updating slug, check uniqueness
  if (parsed.slug) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', parsed.slug)
      .neq('id', id)
      .single()
    
    if (existing) {
      throw new Error(`Category with slug "${parsed.slug}" already exists`)
    }
  }
  
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...parsed,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // ⚡ FIXED FOR NEXT.JS 16: Clear the edge layout cache globally
  revalidateTag('categories-list', 'default')
  revalidateTag('categories-with-counts', 'default')
  
  return addPublicUrlToCategory(data)
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
  const { authorized } = await verifyAdmin(['super_admin'])
  if (!authorized) throw new Error('Forbidden. Super Admin access required.')

  const supabase = await createServerClient()
  
  // Check if category has products
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
  
  if (count && count > 0) {
    throw new Error(`Cannot delete category with ${count} products. Move or reassign products first.`)
  }
  
  // Check if category has subcategories
  const { count: subCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)
  
  if (subCount && subCount > 0) {
    throw new Error(`Cannot delete category with ${subCount} subcategories. Move or delete subcategories first.`)
  }
  
  // Delete category image if exists
  const { data: category } = await supabase
    .from('categories')
    .select('image')
    .eq('id', id)
    .single()
  
  if (category?.image) {
    try {
      await deleteProductImage(category.image)
    } catch (err) {
      console.error('Failed to delete category image:', err)
      // Don't throw, continue with deletion
    }
  }
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // ⚡ FIXED FOR NEXT.JS 16: Force clear categories from CDN memory paths
  revalidateTag('categories-list', 'default')
  revalidateTag('categories-with-counts', 'default')
}

// Update display order (drag & drop)
export async function updateCategoryOrder(orderedIds: string[]): Promise<void> {
  const supabase = await createServerClient()
  
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('categories')
      .update({ display_order: i })
      .eq('id', orderedIds[i])
    
    if (error) throw error
  }
  
  // ⚡ FIXED FOR NEXT.JS 16: Ensure menu sorting updates clear immediately
  revalidateTag('categories-list', 'default')
  revalidateTag('categories-with-counts', 'default')
}

// Toggle category active status
export async function toggleCategoryStatus(id: string, isActive: boolean): Promise<Category> {
  return updateCategory(id, { is_active: isActive })
}

// Get category count
export async function getCategoryCount(): Promise<number> {
  const supabase = await createServerClient()
  
  const { count, error } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('Error counting categories:', error)
    return 0
  }
  
  return count || 0
}

// Bulk update category order (for batch operations)
export async function bulkUpdateCategoryOrder(updates: Array<{ id: string; display_order: number }>): Promise<void> {
  const supabase = await createServerClient()
  
  for (const { id, display_order } of updates) {
    const { error } = await supabase
      .from('categories')
      .update({ display_order })
      .eq('id', id)
    
    if (error) throw error
  }
  
  // ⚡ FIXED FOR NEXT.JS 16: Ensure menu sorting updates clear immediately
  revalidateTag('categories-list', 'default')
  revalidateTag('categories-with-counts', 'default')
}

// Get categories for dropdown (simplified)
export async function getCategoriesForSelect(): Promise<Array<{ id: string; name: string; parent_id: string | null }>> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories for select:', error)
    return []
  }
  
  return data || []
}

// Get category with product count by slug
export async function getCategoryWithCountBySlug(slug: string): Promise<(Category & { product_count: number }) | null> {
  const supabase = await createServerClient()
  
  const { data: category, error } = await supabase
    .from('categories')
    .select(`
      *,
      products:products(count)
    `)
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('Error fetching category with count by slug:', error)
    return null
  }
  
  const categoryWithCount = {
    ...category,
    product_count: category.products?.[0]?.count || 0
  }
  
  return categoryWithCount ? addPublicUrlToCategory(categoryWithCount) : null
}