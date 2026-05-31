// src/app/(shop)/products/page.tsx

import { Metadata } from 'next'
import { getProductsWithSignedUrls } from '@/services/product.service'
import { getCategories } from '@/services/category.service'
import ProductsClientView from './ProductsClientView'
import Container from '@/components/ui/Container'
import { Suspense } from 'react'
import { siteConfig } from '@/config/site'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const selectedCategory = params.category

  if (selectedCategory) {
    const categories = await getCategories()
    const category = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory)

    if (category) {
      return {
        title: category.meta_title || category.name,
        description: category.meta_description || `High-quality ${category.name} packaging.`,
      }
    }
  }

  return {
    title: 'All Products',
    description: 'Explore our range of premium packaging materials.',
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const [products, categories] = await Promise.all([
    getProductsWithSignedUrls(),
    getCategories()
  ])

  return (
    <div className="min-h-screen bg-[#F0F2F2]" suppressHydrationWarning>
      <Container className="py-4 md:py-6 max-w-[1500px]">
        <Suspense fallback={<div className="py-20 text-center"></div>}>
          <ProductsClientView 
            initialProducts={products as any} 
            categories={categories}
          />
        </Suspense>
      </Container>
    </div>
  )
}