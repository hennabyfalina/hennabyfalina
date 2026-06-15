// src/proxy.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']
const PROTECTED_ROUTES = ['/profile', '/checkout', '/wishlist', '/order']
const ADMIN_ROUTES = ['/admin']
const GATE_PAGE = '/admin-gate'

// 🛡️ TRAFFIC ESCAPE: Public endpoints that require zero backend compute lookups
const PUBLIC_STATIC_PATHS = [
  '/', 
  '/products', 
  '/faq', 
  '/returns-refunds', 
  '/contact-support', 
  '/privacy-policy', 
  '/terms-conditions',
  '/about',
  '/services',
  '/collections',
  '/about'
]

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Ensure original host is preserved to prevent redirect loops (SEO Fix)
  const host = request.headers.get('host')
  if (host) response.headers.set('X-Forwarded-Host', host)

  // Standard Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  const isDev = process.env.NODE_ENV !== 'production'
  
  // ✨ B2B SECURE CSP ✨
  response.headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://accounts.google.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: blob: https: https://maps.gstatic.com https://maps.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://*.razorpay.com https://graph.facebook.com https://vitals.vercel-insights.com https://www.google-analytics.com https://challenges.cloudflare.com https://accounts.google.com https://maps.googleapis.com; frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://challenges.cloudflare.com https://accounts.google.com https://*.supabase.co https://www.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';`)
  
  const path = request.nextUrl.pathname
  
  // 🚨 WHATSAPP TEMPLATE ROUTING AUTOMATION
  if (path.startsWith('/profile/orders/') && path.length > '/profile/orders/'.length) {
    const rawOrderId = path.replace('/profile/orders/', '')
    const newUrl = new URL(`/order/${encodeURIComponent(rawOrderId)}`, request.url)
    newUrl.search = request.nextUrl.search
    return NextResponse.redirect(newUrl)
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r))
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => path.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => path.startsWith(r))
  const isGatePage = path === GATE_PAGE

  // 🚀 EDGE OPTIMIZATION FLUSH LAYER: If it is a standard public window, terminate routing checks instantly.
  // This step single-handedly eliminates unneeded auth checks and database connection swimming.
  const isDynamicProductView = path.startsWith('/product/') || path.startsWith('/collections/')
  const isPublicStorefrontView = PUBLIC_STATIC_PATHS.includes(path) || isDynamicProductView

  if (isPublicStorefrontView && !isAuthRoute && !isProtectedRoute && !isAdminRoute && !isGatePage) {
    return response
  }

  // Only initialize the server client context block if hitting security-gated domains
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        experimental: { passkey: true },
      },
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
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

  // 1. Anonymity Enforcement
  if (!user) {
    if (isProtectedRoute || isAdminRoute || isGatePage) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('next', path + request.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = !error && (profile?.role === 'admin' || profile?.role === 'super_admin')

  // 3. Authenticated Navigation Re-routing
  if (isAuthRoute) {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin-gate', request.url))
    }
    const nextUrl = request.nextUrl.searchParams.get('next')
    if (nextUrl && nextUrl.startsWith('/')) {
      return NextResponse.redirect(new URL(nextUrl, request.url))
    }
    return NextResponse.redirect(new URL('/products', request.url))
  }

  // 4. Admin Guard Controls
  if (path.startsWith('/admin/finance') && user) {
    if (profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  if (isGatePage) {
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))
    return response
  }

  if (isAdminRoute) {
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))

    const gateCookie = request.cookies.get('admin_gate_passed')
    if (!gateCookie || gateCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/admin-gate', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 🛡️ PERFORMANCE MATCHING SHIELD
     * Excludes system paths and asset formats to bypass middleware invocation costs.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ttf)$).*)',
  ],
}