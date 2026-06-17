// next.config.ts

import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/~offline",
  }
});

const nextConfig: NextConfig = {
  // Silences the Next.js 16 Turbopack warning caused by the PWA plugin's webpack config
  turbopack: {},
  images: {
    remotePatterns: [
      // Supabase Storage (your main product images)
      {
        protocol: 'https',
        hostname: 'zclhqqpbrxozebayyiks.supabase.co',
        port: '',
        pathname: '/**',
      },
      // Placeholder images
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Your custom domain
      {
        protocol: 'https',
        hostname: 'hennabyfalina.com',
      },
      // Google user content (profile pictures, etc.)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.google.com',
      },
      // Google Maps Static API
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
    ],
    
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 30 days to drastically improve Core Web Vitals
    minimumCacheTTL: 31536000, 
    // Allow private IPs (IPv6 ranges) for Supabase storage resolution
    dangerouslyAllowLocalIP: true,
  },
  
  // Security: Enable React Strict Mode for development
  reactStrictMode: true,
  
  // Security: Disable X-Powered-By header
  poweredByHeader: false,
  
  // 🚨 ENTERPRISE MAXIMUM LOG SECURE STRATEGY 🚨
  // Change from configuration object to explicit boolean to completely strip
  // ALL logs, errors, and warnings out of the compiled code bundle in production.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security: CSRF Protection for Server Actions
  experimental: {
    serverActions: {
      // Add any other domains you plan to deploy to here
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000', 'hennabyfalina.com', 'www.hennabyfalina.com'],
    },
  },

  // Security: Advanced HTTP Headers
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    return [
      {
        source: '/(.*)', // Apply enterprise security to ALL routes
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Allows same-origin iframes (required for PDF previews)
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Mitigates Cross-Site Scripting
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Enforces strict HTTPS
          },
          {
            key: 'Permissions-Policy',
            value: 'publickey-credentials-get=*, publickey-credentials-create=*',
          },
          {
            // ✨ B2B SECURE CSP: Updated to allow Google OneTap, Supabase PDFs, and dynamic Country Flags ✨
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://checkout.razorpay.com https://cdn.razorpay.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://accounts.google.com https://maps.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: blob: https: https://maps.gstatic.com https://maps.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://*.razorpay.com https://graph.facebook.com https://vitals.vercel-insights.com https://www.google-analytics.com https://challenges.cloudflare.com https://accounts.google.com https://maps.googleapis.com https://cdn.jsdelivr.net; frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://challenges.cloudflare.com https://accounts.google.com https://*.supabase.co https://www.google.com; worker-src 'self' blob: https://cdn.jsdelivr.net; object-src 'none'; base-uri 'self'; form-action 'self';`,
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Redirect legacy
  async redirects() {
    return [
      {
        source: '/the-broken-url-google-is-crawling',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/privacy.html',
        destination: '/privacy-policy',
        permanent: true,
      },
    ]
  },
};

// ⚡ Export pure withPWA profile
export default withPWA(nextConfig);