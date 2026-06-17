// src/services/storage.service.ts

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'

export async function uploadFileAsAdmin(formData: FormData, filePath: string) {
  // 1. Secure Server-Side Gatekeeper Authentication
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized upload attempt')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('File missing in payload')

  const supabase = createAdminClient()
  
  // 2. Convert to ArrayBuffer for reliable Node/Edge runtime upload, bypassing 400 Bad Requests
  const arrayBuffer = await file.arrayBuffer()

  // 3. Bypass RLS entirely using Admin Privileges
  const { error } = await supabase.storage
    .from('shop-assets')
    .upload(filePath, arrayBuffer, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || 'image/jpeg'
    })

  if (error) throw new Error(`Upload fault: ${error.message}`)
  return filePath
}

export async function deleteFileAsAdmin(imagePath: string) {
  const { authorized } = await verifyAdmin(['admin', 'super_admin'])
  if (!authorized) throw new Error('Unauthorized delete attempt')

  const supabase = createAdminClient()
  const cleanPath = imagePath.replace(/^(\.\.\/|\/)+/, '')

  const { error } = await supabase.storage
    .from('shop-assets')
    .remove([cleanPath])

  if (error) throw new Error(`Delete fault: ${error.message}`)
}