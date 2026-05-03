// src/lib/supabase/storage.ts

import { createClient } from './client'

// Cache for URLs (kept for backward compatibility)
const urlCache = new Map<string, { url: string; expires: number }>()

/**
 * Get a public URL for a file in the products bucket
 * @param path File path in bucket (e.g., "temp/123456_abc.jpg")
 * @returns Full public URL
 */
export function getPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL')
    return '/placeholder-product.svg'
  }
  return `${supabaseUrl}/storage/v1/object/public/products/${path}`
}

/**
 * 🆕 Get product image URL – handles raw filenames and full paths
 */
export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/placeholder-product.svg'
  
  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Already starts with / (local path)
  if (imagePath.startsWith('/')) {
    return imagePath
  }
  
  // Check if the path already contains 'temp/'
  const hasTempPrefix = imagePath.includes('temp/')
  const normalizedPath = hasTempPrefix ? imagePath : `temp/${imagePath}`
  
  return getPublicUrl(normalizedPath)
}

/**
 * Validate file before upload
 */
function validateFile(file: File): void {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file format. Allowed: JPEG, PNG, WebP')
  }
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit')
  }
}

/**
 * Upload an image to the public bucket (temp folder).
 * @param file Image file to upload
 * @returns File path (e.g., "temp/123456_abc.jpg")
 */
export async function uploadProductImage(file: File): Promise<string> {
  validateFile(file)

  const supabase = createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('Missing Supabase configuration')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `temp/${fileName}`

  const { error } = await supabase.storage
    .from('products')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  return filePath
}

/**
 * Get a signed URL for a private image (kept for backward compatibility)
 * Now redirects to public URL since bucket is public
 * @param path File path in bucket
 * @param expiresIn Seconds until URL expires (ignored for public URLs)
 */
export async function getSignedImageUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    return getPublicUrl(path)
  } catch (error) {
    console.error('Error getting image URL:', error)
    return '/placeholder-product.svg'
  }
}

/**
 * Delete an image from storage.
 * @param path File path to delete
 */
export async function deleteProductImage(path: string): Promise<void> {
  const supabase = createClient()

  if (path.includes('..') || path.includes('//')) {
    throw new Error('Invalid file path')
  }

  const { error } = await supabase.storage.from('products').remove([path])
  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Delete failed: ${error.message}`)
  }
  urlCache.delete(path)
}

/**
 * Check if a file exists in storage
 * @param path File path to check
 */
export async function fileExists(path: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.storage
      .from('products')
      .download(path)
    
    if (error) return false
    return true
  } catch {
    return false
  }
}