// src/lib/supabase/storage.ts

import { createClient } from './client'
import path from 'path'

export function getPublicUrl(imagePath: string, width?: number, height?: number): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '/placeholder-product.svg';

  const bucketUrl = `${supabaseUrl}/storage/v1/object/public/products/`;
  const cleanPath = imagePath.replace(/^(\.\.\/|\/)+/, '');

  if (!width) {
    return `${bucketUrl}${cleanPath}`;
  }

  // 🔒 Ask Supabase to scale, compress, and output in WebP format automatically
  return `${bucketUrl}${cleanPath}?width=${width}&height=${height || ''}&resize=contain&format=webp&quality=80`;
}

export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/placeholder-product.svg'
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  const hasTempPrefix = imagePath.startsWith('temp/')
  return getPublicUrl(hasTempPrefix ? imagePath : `temp/${imagePath}`)
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

export async function uploadProductImage(file: File): Promise<string> {
  validateFile(file)
  const supabase = createClient()

  // Generate an un-guessable cryptographic baseline name
  const fileExt = file.name.split('.').pop()
  const cryptoToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
  const filePath = `temp/${Date.now()}_${cryptoToken}.${fileExt}`

  const { error } = await supabase.storage
    .from('products')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Upload fault: ${error.message}`)
  return filePath
}

export async function deleteProductImage(imagePath: string): Promise<void> {
  const supabase = createClient()
  
  // 🔒 SECURE: Strict traversal pattern blocking
  if (imagePath.includes('..') || imagePath.includes('//') || Object.getOwnPropertyNames(imagePath).length > 200) {
    throw new Error('Unauthorized system execution exception context path')
  }

  const cleanPath = imagePath.replace(/^(\.\.\/|\/)+/, '')
  await supabase.storage.from('products').remove([cleanPath])
}

export async function fileExists(imagePath: string): Promise<boolean> {
  const supabase = createClient()
  const cleanPath = imagePath.replace(/^(\.\.\/|\/)+/, '')
  
  try {
    const { data, error } = await supabase.storage.from('products').download(cleanPath)
    return !error && !!data
  } catch {
    return false
  }
}