// src/app/(shop)/products/page.tsx

import { Metadata } from 'next'
import { getProductsWithSignedUrls } from '@/services/product.service'
import { getCategories } from '@/services/category.service'
import ProductsClientView from './ProductsClientView'
import { Suspense } from 'react'

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
        title: `${category.meta_title || category.name} | Henna By Falina`,
        description: category.meta_description || `Explore our premium, 100% chemical-free organic ${category.name} collection.`,
      }
    }
  }

  return {
    title: 'The Organic Collection | Henna By Falina',
    description: 'Browse our complete suite of triple-sifted henna powders, fresh bridal cones, pure essential mixing oils, and stencils.',
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  // Parallel intake matrix ensures fast server resolution metrics
  const [products, categories] = await Promise.all([
    getProductsWithSignedUrls(),
    getCategories()
  ])

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <div className="py-2 px-4 sm:px-6 max-w-[1600px] mx-auto">
        <Suspense fallback={<div className="py-20 text-center text-gray-400 font-medium text-xs animate-pulse">Loading Collection...</div>}>
          <ProductsClientView 
            initialProducts={products as any} 
            categories={categories}
          />
        </Suspense>
      </div>
    </div>
  )
}