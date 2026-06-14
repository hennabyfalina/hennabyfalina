// src/app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hennabyfalina.com';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products', '/wholesale', '/faq', '/returns-refunds', '/contact-support', '/privacy-policy', '/terms-conditions'],
      disallow: ['/api/', '/auth/', '/cart/', '/checkout/', '/profile/', '/admin/', '/_next/', '/*?*sort='],
    },
    sitemap: 'https://hennabyfalina.com/sitemap.xml',
  }
}