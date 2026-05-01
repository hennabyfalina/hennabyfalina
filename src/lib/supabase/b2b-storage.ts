// src/lib/supabase/b2b-storage.ts

import { createClient } from './client'

/**
 * 🚨 SECURE B2B UPLOAD
 * Saves to artworks/[userId]/[timestamp]_[name]
 */
export async function uploadB2BArtwork(file: File, userId: string): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { error } = await supabase.storage
    .from('artworks')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  // Return the internal path. We use Signed URLs to view it.
  return filePath
}

/**
 * 🔒 SECURE PREVIEW/DOWNLOAD
 * Generates a 1-hour temporary link to view the private artwork
 */
export async function getSignedB2BUrl(path: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('artworks')
    .createSignedUrl(path, 3600) // Expires in 60 mins

  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data.signedUrl
}

/**
 * 🗑️ DELETE TEMP ARTWORK
 * Used if a user removes a file before placing the order
 */
export async function deleteB2BArtwork(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from('artworks').remove([path])
  if (error) console.warn('Failed to delete artwork:', error)
}