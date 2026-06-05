import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  
  if (!path) return new NextResponse('Artwork path is required', { status: 400 })

  // 🔒 PATH TRAVERSAL SHIELD: Reject arbitrary directory traversal requests
  const normalizedPath = decodeURIComponent(path)
  
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return NextResponse.redirect(normalizedPath)
  }

  if (normalizedPath.includes('../') || normalizedPath.includes('./') || normalizedPath.startsWith('/')) {
    return new NextResponse('Invalid path structure detected.', { status: 403 })
  }

  try {
    // 🔒 IDOR / AUTHENTICATION SHIELD: Verify file ownership
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isTempUpload = normalizedPath.startsWith('temp_uploads/')

    if (!user && !isTempUpload) {
      return new NextResponse('Unauthorized access.', { status: 401 })
    }

    // Only allow users to access files in their UUID folder or temp folder, unless they are an admin
    if (!isTempUpload) {
      const isOwner = user && (normalizedPath.startsWith(`${user.id}/`) || normalizedPath.includes(user.id))
      if (!isOwner) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user?.id).single()
        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
          console.error(`[Security] User ${user?.id} attempted to access artwork ${normalizedPath}`)
          return new NextResponse('Forbidden access.', { status: 403 })
        }
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const adminSupabase = createSupabaseAdminClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await adminSupabase.storage.from('artworks').createSignedUrl(path, 3600)
    
    if (error || !data?.signedUrl) {
      return new NextResponse('File not found in storage bucket', { status: 404 })
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (err) {
    console.error('Artwork download error:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
