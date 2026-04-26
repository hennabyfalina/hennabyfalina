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
        hostname: 'fpravakwmhdeucrcmdnk.supabase.co',
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
        hostname: 'razackpackagingcentre.com',
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
    ],
    
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 30 days to drastically improve Core Web Vitals
    minimumCacheTTL: 2592000, 
  },
  
  // Security: Enable React Strict Mode for development
  reactStrictMode: true,
  
  // Security: Disable X-Powered-By header
  poweredByHeader: false,
  
  // Security: CSRF Protection for Server Actions
  experimental: {
    viewTransition: true,
    serverActions: {
      // Add any other domains you plan to deploy to here
      allowedOrigins: ['localhost:3000', 'razackpackagingcentre.com'],
    },
  },

  // Security: Advanced HTTP Headers
  async headers() {
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
            value: 'DENY', // Prevents Clickjacking attacks
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
};

export default withPWA(nextConfig);