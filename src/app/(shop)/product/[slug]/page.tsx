// src/app/(shop)/product/[slug]/page.tsx

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductWithSignedUrls, getProductsByIdsWithSignedUrls } from '@/services/product.service'
import Container from '@/components/ui/Container'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import SaveViewedProduct from '@/components/product/SaveViewedProduct'
import { siteConfig } from '@/config/site'
import dynamic from 'next/dynamic'
import ProductInteractiveSection from '@/components/product/ProductInteractiveSection'
import ProductPageHeader from '@/components/product/ProductPageHeader'
import ProductActionDock from '@/components/product/ProductActionDock'
import { getVariantBasePrice } from '@/lib/pricing'

// Cache individual dynamic product pages at Vercel's Edge CDN.
export const revalidate = 3600 // Revalidate product data once per hour

const FrequentlyBoughtTogether = dynamic(() => import('@/components/product/FrequentlyBoughtTogether'), {
  loading: () => <div className="w-full h-32 bg-stone-50/40 animate-pulse rounded-xl mt-6" />
})

const RelatedProducts = dynamic(() => import('@/components/product/RelatedProducts'), {
  loading: () => <div className="w-full h-64 bg-stone-50/40 animate-pulse rounded-xl mt-6" />
})

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductWithSignedUrls(slug)
  if (!product) return {}

  return {
    title: product.meta_title || `${product.name} | ${siteConfig.name}`,
    description: product.meta_description || product.description || `Discover premium organic ${product.name} at Henna By Falina. 100% chemical-free and crafted for impeccable henna designs.`,
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.description || '',
      images: product.images?.[0] ? [product.images[0]] : [],
    },
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    other: {
      hideGlobalMobileNav: 'true',
      hideGlobalMobileBottomNav: 'true'
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductWithSignedUrls(slug)

  if (!product) {
    notFound()
  }

  // Fetch Frequently Bought Together bundle items
  let bundleProducts: any[] = []
  if (product.frequently_bought_together && product.frequently_bought_together.length > 0) {
    bundleProducts = await getProductsByIdsWithSignedUrls(product.frequently_bought_together)
  }

  const hasStock = product.stock > 0
  
  // ⚡ ENHANCED SCHEMA SOLVER: Resolves accurate low-bounds for variant-only models to avoid Google validation failures
  const resolvedBasePrice = getVariantBasePrice(product as any, null)

  // Enterprise JSON-LD Schema (Clean SEO Core)
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images || [],
    description: product.description || `Buy ${product.name} at ${siteConfig.name}`,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: siteConfig.name
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: resolvedBasePrice,
      availability: hasStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: siteConfig.name
      }
    }
  }

  if (product.rating && product.review_count) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.review_count
    }
  }

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-32 select-none font-sans antialiased text-gray-900 selection:bg-gray-950 selection:text-white">
      <script
        id="schema-product"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      
      {/* 📱 MOBILE TOP NAV TUNNEL BAR */}
      <ProductPageHeader productName={product.name} productId={product.id} />
      
      {/* 💻 STICKY ACTION HORIZON DOCK */}
      <ProductActionDock 
        product={product}
        sellingPrice={resolvedBasePrice}
        hasStock={hasStock}
      />

      <SaveViewedProduct product={product} /> 

      {/* Balanced Split Layout for Desktop, Centered Stream for Mobile */}
      <Container className="pt-20 pb-6 md:pt-10 max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* Minimal Desktop Navigation Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-2 text-[12px] font-medium tracking-wide text-gray-400">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span className="text-gray-200">/</span>
          <Link href="/products" className="hover:text-gray-900 transition-colors">Products</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-900 font-normal capitalize">
            {product.name}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
          {/* Large Media Canvas Case (Left side on Desktop) */}
          <div className="w-full md:w-1/2 sticky top-24">
            <ProductImageGallery images={product.images || []} productName={product.name} />
          </div>

          {/* Fluid Inline Options and Text Content (Right side on Desktop) */}
          <div className="w-full md:w-1/2 relative z-20">
             <ProductInteractiveSection 
                product={product} 
                hasStock={hasStock} 
                sellingPrice={resolvedBasePrice} 
             />
          </div>
        </div>

        {/* Curated Recommendations & Cross-Sell Blocks */}
        <div className="relative z-0 mt-0 pt-0 md:pt-10">
          {bundleProducts.length > 0 && (
            <FrequentlyBoughtTogether 
              mainProduct={product as any} 
              bundleProducts={bundleProducts} 
            />
          )}
        </div>

        {/* Infinite Related Products Swiper Deck */}
        <div className="relative z-0">
          <RelatedProducts currentProductId={product.id} categoryId={product.category_id} />
        </div>
        
      </Container>
    </div>
  )
}