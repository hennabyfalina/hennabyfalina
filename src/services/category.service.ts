'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { getPublicUrl, deleteProductImage } from '@/lib/supabase/storage'

export interface Category {
  meta_title: string
  meta_description: string
  low_stock_threshold: number
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  parent_id?: string | null
  display_order: number
  is_active: boolean
  product_count?: number
  created_at: string
  updated_at: string
}

// Cache for categories (simple in-memory, invalidate on mutations)
let categoriesCache: Category[] | null = null
let categoriesWithCountsCache: Category[] | null = null
let lastCacheInvalidation = 0
const CACHE_TTL = 60000 // 1 minute

function isCacheValid(lastInvalidation: number): boolean {
  return Date.now() - lastInvalidation < CACHE_TTL
}

function invalidateCache() {
  categoriesCache = null
  categoriesWithCountsCache = null
  lastCacheInvalidation = Date.now()
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

// Fetch all categories with product counts
export async function getCategoriesWithCounts(useCache: boolean = true): Promise<Category[]> {
  // Check cache
  if (useCache && categoriesWithCountsCache && isCacheValid(lastCacheInvalidation)) {
    return categoriesWithCountsCache
  }
  
  const supabase = await createServerClient()
  
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      products:products(count)
    `)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories with counts:', error)
    return []
  }
  
  const result = categories.map(cat => ({
    ...cat,
    product_count: cat.products?.[0]?.count || 0
  })) || []
  
  // Add public URLs to images
  const resultWithUrls = addPublicUrlsToCategories(result)
  
  // Update cache
  if (useCache) {
    categoriesWithCountsCache = resultWithUrls
  }
  
  return resultWithUrls
}

// Fetch all categories (without counts)
export async function getCategories(useCache: boolean = true): Promise<Category[]> {
  // Check cache
  if (useCache && categoriesCache && isCacheValid(lastCacheInvalidation)) {
    return categoriesCache
  }
  
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  // Add public URLs to images
  const resultWithUrls = addPublicUrlsToCategories(data || [])
  
  // Update cache
  if (useCache) {
    categoriesCache = resultWithUrls
  }
  
  return resultWithUrls
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
  const supabase = await createServerClient()
  
  // Check if slug already exists
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', data.slug)
    .single()
  
  if (existing) {
    throw new Error(`Category with slug "${data.slug}" already exists`)
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
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      parent_id: data.parent_id,
      is_active: data.is_active ?? true,
      display_order: newDisplayOrder
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Invalidate cache
  invalidateCache()
  
  return addPublicUrlToCategory(category)
}

// Update category
export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category> {
  const supabase = await createServerClient()
  
  // If updating slug, check uniqueness
  if (updates.slug) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', updates.slug)
      .neq('id', id)
      .single()
    
    if (existing) {
      throw new Error(`Category with slug "${updates.slug}" already exists`)
    }
  }
  
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Invalidate cache
  invalidateCache()
  
  return addPublicUrlToCategory(data)
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
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
  
  // Invalidate cache
  invalidateCache()
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
  
  // Invalidate cache
  invalidateCache()
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
  
  // Invalidate cache
  invalidateCache()
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