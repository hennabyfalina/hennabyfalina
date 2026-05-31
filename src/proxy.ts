// src/proxy.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']
const PROTECTED_ROUTES = ['/profile', '/checkout', '/wishlist', '/order']
const ADMIN_ROUTES = ['/admin']
const GATE_PAGE = '/admin-gate'

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
  
  // ✨ B2B SECURE CSP: Updated to allow Google OneTap, Supabase PDFs, and dynamic Country Flags ✨
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://*.razorpay.com https://graph.facebook.com https://vitals.vercel-insights.com https://www.google-analytics.com https://challenges.cloudflare.com https://accounts.google.com; frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://challenges.cloudflare.com https://accounts.google.com https://*.supabase.co; worker-src 'self' blob:; object-src 'self' https://*.supabase.co data: blob:; base-uri 'self'; form-action 'self';")
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  const path = request.nextUrl.pathname
  
  // 🚨 WHATSAPP TEMPLATE ROUTING FIX 🚨
  // Meta WhatsApp template uses /profile/orders/{{1}} but the app uses /order/[id]
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

  // 1. If no user is logged in, restrict protected and admin areas
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

  // 2. Auth Route Logic: Admins go to Gate, Customers go to Products
  if (isAuthRoute) {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin-gate', request.url))
    }
    return NextResponse.redirect(new URL('/products', request.url))
  }

  // 3. 🚨 GOD MODE LOGIC 🚨
  // We removed the redirect that sent Admins from /profile to /admin/dashboard.
  // Now, the logic only blocks NON-ADMINS from entering Admin territory.

  if (isGatePage) {
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))
    return response
  }

  if (isAdminRoute) {
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))

    // Require the Gate Code session cookie for /admin access
    const gateCookie = request.cookies.get('admin_gate_passed')
    if (!gateCookie || gateCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/admin-gate', request.url))
    }
  }

  // 4. Default fallthrough: Allows Admins to access /profile and Storefront freely
  return response
}

// Ensure middleware only runs on essential routes to optimize speed
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}