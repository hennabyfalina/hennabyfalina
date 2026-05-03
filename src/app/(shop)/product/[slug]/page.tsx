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

const FrequentlyBoughtTogether = dynamic(() => import('@/components/product/FrequentlyBoughtTogether'), {
  loading: () => <div className="w-full h-32 bg-gray-50 animate-pulse rounded-lg mt-8" />
})

const RelatedProducts = dynamic(() => import('@/components/product/RelatedProducts'), {
  loading: () => <div className="w-full h-64 bg-gray-50 animate-pulse rounded-lg mt-8" />
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
    description: product.meta_description || product.description || `Buy ${product.name} online. High-quality packaging materials.`,
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.description || '',
      images: product.images?.[0] ? [product.images[0]] : [],
    },
    alternates: {
      canonical: `/product/${product.slug}`,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductWithSignedUrls(slug)

  if (!product) {
    notFound()
  }

  // Phase 1: Fetch the Frequently Bought Together bundle
  let bundleProducts: any[] = []
  if (product.frequently_bought_together && product.frequently_bought_together.length > 0) {
    bundleProducts = await getProductsByIdsWithSignedUrls(product.frequently_bought_together)
  }

  const hasStock = product.stock > 0
  const sellingPrice = product.selling_price ?? product.price ?? 0
  const regularPrice = product.price ?? 0
  const discountPercentage = regularPrice > sellingPrice ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100) : 0

  // 🚨 Enterprise JSON-LD Schema (SEO Core)
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
      price: sellingPrice,
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
    <div className="bg-white min-h-screen pb-12 relative z-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      
      {/* Hidden Tracker for Recently Viewed */}
      <SaveViewedProduct 
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0] || '',
          images: product.images || [],
          selling_price: product.selling_price || product.price,
          bulk_price: product.bulk_price,
          bulk_min_quantity: product.bulk_min_quantity,
          description: product.description,
          rating: product.rating,
          review_count: product.review_count,
          stock: product.stock, // Ensure stock is included for accurate tracking
        }}
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 py-2 hidden md:block">
        <Container className="max-w-[1500px]">
          <div className="text-xs text-gray-500 flex gap-2">
            <Link href="/" className="hover:underline">Home</Link>
            <span>›</span>
            <Link href="/products" className="hover:underline">Products</Link>
            <span>›</span>
            <span className="text-gray-900 truncate">{product.name}</span>
          </div>
        </Container>
      </div>

      <Container className="py-4 md:py-6 max-w-[1500px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">
          
          {/* 🚨 THE FIX: Left Column (Image Gallery) 
              Removed z-10, added relative, z-[1], and self-start to strictly contain the images
          */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 relative z-[1] w-full self-start">
            <ProductImageGallery images={product.images || []} productName={product.name} />
          </div>

          {/* Unified Middle & Right Columns (Spans 7 cols) - Client Side Interactive Logic */}
          <div className="lg:col-span-7 w-full relative z-[2]">
             <ProductInteractiveSection 
                product={product} 
                hasStock={hasStock} 
                sellingPrice={sellingPrice} 
                regularPrice={regularPrice}
                discountPercentage={discountPercentage}
             />
          </div>

        </div>

        {/* Frequently Bought Together Bundle */}
        <div className="mt-10 md:mt-12 relative z-0">
          <FrequentlyBoughtTogether mainProduct={product as any} bundleProducts={bundleProducts} />
        </div>

        <hr className="border-gray-200 my-10 md:my-16" />

        {/* Related Products Carousel */}
        <div className="relative z-0">
          <RelatedProducts currentProductId={product.id} categoryId={product.category_id} />
        </div>
      </Container>
    </div>
  )
}