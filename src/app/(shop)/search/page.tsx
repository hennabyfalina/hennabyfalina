// src/app/(shop)/search/page.tsx

import { redirect } from 'next/navigation'
import { searchProductsWithSignedUrls } from '@/services/product.service'
import { getCategories } from '@/services/category.service'
import ProductsClientView from '@/app/(shop)/products/ProductsClientView'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Search results | ${siteConfig.name.toLowerCase()}`,
  description: 'Search our boutique studio catalog for premium organic henna essentials.',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const rawQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''
  const q = rawQuery.trim()

  // 1. Fetch data arrays in parallel early on the edge matrix
  const [products, categories] = await Promise.all([
    q ? searchProductsWithSignedUrls(q, 100) : Promise.resolve([]),
    getCategories()
  ])

  if (q) {
    const normalizedQuery = q.toLowerCase()

    // 🌟 STRATEGY STEP A: Check for direct category name or slug matches
    const targetCategory = categories.find(
      (c: any) => c.slug.toLowerCase() === normalizedQuery || c.name.toLowerCase() === normalizedQuery
    )
    if (targetCategory) {
      redirect(`/products?category=${targetCategory.slug || targetCategory.id}`)
    }

    // 🌟 STRATEGY STEP B: If exactly one product matches, redirect straight to its detail view
    if (products.length === 1) {
      redirect(`/product/${products[0].slug}`)
    }
  }

  // Map product pricing tiers safely for remaining multi-match queries
  const initialProducts = products.map((product: any) => ({
    ...product,
    pricing_tiers: product.pricing_tiers || [] 
  }))

  return (
    <div className="w-full bg-white min-h-screen pb-24 select-none font-sans antialiased text-left" suppressHydrationWarning>
      {/* Constrained layout width matching our storefront standard alignment */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8 flex flex-col gap-6">
        
        {/* Clean, un-boxed title bar with zero heavy border accents */}
        <div className="pb-2">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-950 tracking-tight lowercase">
            {q ? `search results for "${q.toLowerCase()}"` : 'search our catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-normal mt-1">
            {initialProducts.length} matching items resolved dynamically
          </p>
        </div>

        {/* Core display grid fallback stream */}
        <ProductsClientView 
          initialProducts={initialProducts} 
          categories={categories} 
        />
      </div>
    </div>
  )
}