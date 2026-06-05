// src/app/api/admin/artwork/route.ts

import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  
  if (!path) return new NextResponse('Artwork path is required', { status: 400 })

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return NextResponse.redirect(path)
  }

  try {
    const { authorized, response } = await verifyAdmin(['admin', 'super_admin'])
    if (!authorized) return response!

    // 2. Escalate Privileges: Use Service Role Key to bypass restrictive user RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // Fallback to anon key strictly if testing locally without service role configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const adminSupabase = createSupabaseAdminClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await adminSupabase.storage.from('artworks').createSignedUrl(path, 3600)
    
    if (error || !data?.signedUrl) {
      return new NextResponse('File not found in storage bucket', { status: 404 })
    }

    // 3. Redirect the admin directly to the fully-authorized temporary signed URL
    return NextResponse.redirect(data.signedUrl)
  } catch (err) {
    console.error('Artwork download error:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
