// src/lib/supabase/storage.ts

import { createClient } from './client'
import { compressProductImage } from '../compression'
import { uploadFileAsAdmin, deleteFileAsAdmin } from '@/services/storage.service'

/**
 * Global Asset Resolver: Generates direct web paths out of the shop-assets bucket.
 * Supports automated server-side scaling, layout resizing, and webp compression optimization.
 */
export function getPublicUrl(imagePath: string, width?: number, height?: number): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return '/placeholder-product.svg'

  const bucketUrl = `${supabaseUrl}/storage/v1/object/public/shop-assets/`
  const cleanPath = imagePath.replace(/^(\.\.\/|\/)+/, '')

  if (!width) {
    return `${bucketUrl}${cleanPath}`
  }

  // Request resized and optimized webp assets directly on the edge network
  return `${bucketUrl}${cleanPath}?width=${width}&height=${height || ''}&resize=contain&format=webp&quality=80`
}

/**
 * Universal shortcut utility to resolve images instantly across components.
 */
export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/placeholder-product.svg'
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  
  return getPublicUrl(imagePath)
}

function validateFile(file: File): void {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  const maxSize = 5 * 1024 * 1024 

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file format. Allowed: JPEG, PNG, WebP')
  }
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit')
  }
}

/**
 * Administrative asset upload handler pushing files into clean sub-folders.
 */
export async function uploadProductImage(
  file: File, 
  folder: 'products' | 'categories' | 'collections' = 'products'
): Promise<string> {
  validateFile(file)
  
  const { file: compressedFile } = await compressProductImage(file)

  const fileExt = compressedFile.name.split('.').pop()
  const cryptoToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
  
  const filePath = `${folder}/${Date.now()}_${cryptoToken}.${fileExt}`

  // Create a multipart form payload to ferry the image seamlessly to the Node/Edge Server Action
  const formData = new FormData()
  formData.append('file', compressedFile)

  // Dispatches the upload via secure Server Action to completely bypass restrictive browser RLS policies
  await uploadFileAsAdmin(formData, filePath)

  return filePath
}

export async function deleteProductImage(imagePath: string): Promise<void> {
  if (imagePath.includes('..') || imagePath.includes('//') || Object.getOwnPropertyNames(imagePath).length > 200) {
    throw new Error('Unauthorized system execution exception context path')
  }

  // Offload deletion to the Admin SDK
  await deleteFileAsAdmin(imagePath)
}

export async function fileExists(imagePath: string): Promise<boolean> {
  const supabase = createClient()
  const cleanPath = imagePath.replace(/^(\.\.\/|\/)+/, '')
  
  try {
    const { data, error } = await supabase.storage.from('shop-assets').download(cleanPath)
    return !error && !!data
  } catch {
    return false
  }
}