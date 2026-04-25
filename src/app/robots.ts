// src/app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://razackpackagingcentre.com'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products', '/wholesale', '/custom-order', '/contact', '/faq', '/returns-refunds', '/support'],
      disallow: ['/api/', '/checkout/', '/profile/', '/admin/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}