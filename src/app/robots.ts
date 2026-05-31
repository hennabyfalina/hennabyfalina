// src/app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://razackpackagingcentre.com'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products', '/wholesale', '/custom-order', '/contact', '/faq', '/returns-refunds', '/support', '/privacy', '/terms'],
      disallow: ['/api/', '/auth/', '/cart/', '/checkout/', '/profile/', '/admin/', '/_next/', '/*?*sort='],
    },
    sitemap: 'https://razackpackagingcentre.com/sitemap.xml',
  }
}