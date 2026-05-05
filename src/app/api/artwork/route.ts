import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  
  if (!path) return new NextResponse('Artwork path is required', { status: 400 })

  try {
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
