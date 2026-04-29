import { searchProductsWithSignedUrls } from '@/services/product.service'
import { getCategories } from '@/services/category.service'
import ProductsClientView from '@/app/(shop)/products/ProductsClientView'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Search Results | ${siteConfig.name}`,
  description: 'Search for packaging materials, boxes, and supplies.',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''

  const [products, categories] = await Promise.all([
    q ? searchProductsWithSignedUrls(q, 100) : Promise.resolve([]),
    getCategories()
  ])

  const initialProducts = products.map((product) => ({
    ...product,
    bulk_min_quantity: null,
  }))

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 py-8 min-h-screen">
      {/* Search Header */}
      <div className="mb-4 border-b border-gray-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {q ? `Search results for "${q}"` : 'Search our products'}
        </h1>
      </div>

      <ProductsClientView 
        initialProducts={initialProducts} 
        categories={categories} 
      />
    </div>
  )
}