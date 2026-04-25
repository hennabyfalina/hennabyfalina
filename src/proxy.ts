// src/proxy.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Auth-only pages — redirect to /products if already logged in
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

// Pages that require a valid session
const PROTECTED_ROUTES = ['/profile', '/checkout']

// Admin pages — require session + role === 'admin' + gate passed
const ADMIN_ROUTES = ['/admin']

// Gate page — must be accessible to admins without gate cookie
const GATE_PAGE = '/admin-gate'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ============================================
  // SECURITY HEADERS (from your first middleware)
  // ============================================
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // HSTS - Enable in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // ============================================
  // AUTHENTICATION LOGIC (from your second middleware)
  // ============================================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r))
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => path.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => path.startsWith(r))
  const isGatePage = path === GATE_PAGE

  // Unauthenticated user
  if (!user) {
    if (isProtectedRoute || isAdminRoute || isGatePage) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Role-based routing for authenticated users
  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = !error && profile?.role === 'admin'

  // Authenticated user on auth pages → redirect appropriately
  if (isAuthRoute) {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin-gate', request.url))
    }

    const redirectUrl = request.nextUrl.searchParams.get('redirect')
    if (redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    return NextResponse.redirect(new URL('/products', request.url))
  }

  if (path.startsWith('/profile') || isAdminRoute || isGatePage) {
    // Prevent admins from accessing regular user profile
    if (isAdmin && path.startsWith('/profile')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // Admin Gate Page — Only allow admins
    if (isGatePage) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return response
    }

    // Admin Routes — Require admin role AND gate cookie
    if (isAdminRoute) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      const gateCookie = request.cookies.get('admin_gate_passed')
      if (!gateCookie || gateCookie.value !== 'true') {
        return NextResponse.redirect(new URL('/admin-gate', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}