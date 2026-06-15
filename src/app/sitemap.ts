// src/app/sitemap.ts

import { MetadataRoute } from 'next'
import { getProductsWithSignedUrls } from '@/services/product.service'
import { getCategories } from '@/services/category.service'

// ⚡ SITEMAP EDGE REVALIDATION: Cache sitemap data on the CDN edge for 24 hours
// This single step prevents index crawlers from thrashed serverless or database calls.
export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hennabyfalina.com'

  // Concurrent compilation matrix reads database data packages smoothly
  const [products, categories] = await Promise.all([
    getProductsWithSignedUrls(),
    getCategories()
  ])

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/products?category=${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    '',
    '/products',
    '/faq',
    '/returns-refunds',
    '/privacy-policy',
    '/terms-conditions',
    '/contact-support',
    '/about',
    '/services',
    '/collections',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }))

  return [...staticUrls, ...categoryUrls, ...productUrls]
}