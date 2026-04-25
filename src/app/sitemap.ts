import { MetadataRoute } from 'next'
import { getProductsWithSignedUrls } from '@/services/product.service'
import { getCategories } from '@/services/category.service'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Replace with your actual production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://razackpackagingcentre.com'

  // Fetch all dynamic data concurrently
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
    '/wholesale',
    '/custom-order',
    '/contact',
    '/faq',
    '/returns-refunds',
    '/support'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }))

  return [...staticUrls, ...categoryUrls, ...productUrls]
}