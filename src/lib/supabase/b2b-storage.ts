// src/lib/supabase/b2b-storage.ts

import { createClient } from './client'

// Constants
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
]
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']

/**
 * Validate file before upload
 */
function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only PDF, PNG, and JPG/JPEG files are allowed')
  }

  // Check file extension (additional safety)
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension. Allowed: .pdf, .png, .jpg, .jpeg')
  }
}

/**
 * Generate unique filename
 */
function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}_${random}.${ext}`
}

/**
 * 🚨 UPLOAD WITH TEMP FOLDER SUPPORT
 * - If user logged in: uploads to artworks/{userId}/{filename}
 * - If not logged in: uploads to artworks/temp_uploads/{sessionId}/{filename}
 */
export async function uploadB2BArtwork(
  file: File,
  userId: string | null,
  sessionId?: string
): Promise<string> {
  // Validate file first
  validateFile(file)

  const supabase = createClient()
  const fileName = generateFileName(file.name)
  
  // Determine upload path
  let filePath: string
  if (userId) {
    // Logged in user → final folder
    filePath = `${userId}/${fileName}`
  } else if (sessionId) {
    // Anonymous user → temp folder
    filePath = `temp_uploads/${sessionId}/${fileName}`
  } else {
    throw new Error('Either userId or sessionId is required')
  }

  const { error } = await supabase.storage
    .from('artworks')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  return filePath
}

/**
 * 🔒 SECURE PREVIEW/DOWNLOAD
 * Generates a 1-hour temporary link
 */
export async function getSignedB2BUrl(path: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('artworks')
    .createSignedUrl(path, 3600)

  if (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
  return data.signedUrl
}

/**
 * 🗑️ DELETE ARTWORK
 */
export async function deleteB2BArtwork(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from('artworks').remove([path])
  if (error) console.warn('Failed to delete artwork:', error)
}

/**
 * 🚚 MOVE TEMP FILE TO FINAL FOLDER AFTER ORDER
 * Copies from temp_uploads/{sessionId}/{file} to {userId}/{file}
 * Then deletes the original temp file
 */
export async function moveTempToFinal(
  tempPath: string,
  userId: string,
  supabaseClient?: any
): Promise<string> {
  const supabase = supabaseClient || createClient()
  
  // Extract filename from temp path
  const fileName = tempPath.split('/').pop()
  if (!fileName) {
    throw new Error(`Invalid temp path: ${tempPath}`)
  }

  const finalPath = `${userId}/${fileName}`

  // Copy file to final location
  const { error: copyError } = await supabase.storage
    .from('artworks')
    .copy(tempPath, finalPath)

  if (copyError) {
    console.error('Error copying file:', copyError)
    throw new Error(`Failed to move file to final destination: ${copyError.message}`)
  }

  // Delete temp file
  if (supabaseClient) {
    await supabaseClient.storage.from('artworks').remove([tempPath])
  } else {
    await deleteB2BArtwork(tempPath)
  }

  return finalPath
}

/**
 * 🚚 MOVE ALL TEMP FILES TO FINAL FOLDER AFTER ORDER
 */
export async function moveAllTempToFinal(
  tempPaths: string[],
  userId: string,
  supabaseClient?: any
): Promise<string[]> {
  const finalPaths: string[] = []
  
  for (const tempPath of tempPaths) {
    try {
      const finalPath = await moveTempToFinal(tempPath, userId, supabaseClient)
      finalPaths.push(finalPath)
    } catch (error) {
      console.error(`Failed to move ${tempPath}:`, error)
      // Don't throw – try to move remaining files
    }
  }
  
  return finalPaths
}

/**
 * 💾 GET FILE SIZE (for validation)
 */
export async function getFileSize(path: string): Promise<number | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('artworks')
    .list(path.split('/').slice(0, -1).join('/'), {
      limit: 1,
      offset: 0,
      search: path.split('/').pop()
    })

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0].metadata?.size || null
}