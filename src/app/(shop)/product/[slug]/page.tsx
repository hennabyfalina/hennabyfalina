// src/app/(shop)/product/[slug]/page.tsx

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductWithSignedUrls } from '@/services/product.service'
import Container from '@/components/ui/Container'
import AddToCartButton from '@/components/product/AddToCartButton'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import SaveViewedProduct from '@/components/product/SaveViewedProduct'
import ShareButton from '@/components/product/ShareButton'
import ProductWishlistButton from '@/components/product/ProductWishlistButton'
import StarRating from '@/components/product/StarRating'
import { MapPin, Lock, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { siteConfig } from '@/config/site'
import dynamic from 'next/dynamic'

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

  const hasStock = product.stock > 0
  const sellingPrice = product.selling_price ?? product.price ?? 0
  const regularPrice = product.price ?? 0
  const discountPercentage = regularPrice > sellingPrice ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100) : 0

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images || [],
    description: product.description || `Buy ${product.name} at ${siteConfig.name}`,
    sku: product.sku || product.id,
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

  return (
    <div className="bg-white min-h-screen pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Save to Recently Viewed */}
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
          review_count: product.review_count
        }}
      />

      {/* Optional Breadcrumb */}
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
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 z-10 w-full">
            <ProductImageGallery 
              images={product.images || []} 
              productName={product.name} 
            />
          </div>

          {/* Middle Column: Product Details */}
          <div className="lg:col-span-4 space-y-3">
            <div>
              <h1 className="text-xl sm:text-[22px] leading-tight sm:leading-[28px] font-medium text-[#0F1111] mb-1">
                {product.name}
              </h1>
              <div className="flex items-center justify-between">
                <Link href="/products" className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
                  Visit the {siteConfig.shortName} Store
                </Link>
                <div className="flex items-center gap-4">
                  <ProductWishlistButton productId={product.id} />
                  <ShareButton productName={product.name} productSlug={product.slug} />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4 mt-2">
                <StarRating 
                  rating={product.rating ?? 4.5} 
                  reviewCount={product.review_count ?? 128} 
                  size="md"
                />
              </div>
            </div>

            <hr className="border-gray-200 my-2" />

            {/* Price Section */}
            <div className="flex flex-col gap-1">
              {discountPercentage > 0 && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-light text-[#CC0C39]">
                    -{discountPercentage}%
                  </span>
                  <span className="text-2xl sm:text-3xl font-medium text-[#0F1111]">
                  {formatCurrency(sellingPrice)}
                  </span>
                </div>
              )}
              {discountPercentage === 0 && (
                <span className="text-2xl sm:text-3xl font-medium text-[#0F1111]">
                  {formatCurrency(sellingPrice)}
                </span>
              )}
              
              <div className="text-xs sm:text-sm text-gray-500">
              M.R.P.: <span className="line-through">{formatCurrency(regularPrice)}</span>
              </div>
              <div className="text-sm text-[#0F1111] mt-1">
                Inclusive of all taxes
              </div>
              
              {product.bulk_price && product.bulk_price < sellingPrice && (
                <div className="mt-2 inline-flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 px-3 py-1.5 rounded-sm shadow-sm animate-in fade-in">
                  <Tag className="w-4 h-4 text-green-600 animate-pulse" />
                  <span className="font-bold">Bulk Discount Available:</span>
                <span>Buy <span className="font-extrabold">{product.bulk_min_quantity || 10}+</span> at <span className="font-extrabold">{formatCurrency(product.bulk_price)}</span> each</span>
                </div>
              )}
            </div>

            <hr className="border-gray-200 my-2" />

            {/* Trust Icons Row */}
            <div className="flex justify-between items-start py-2">
               <div className="flex flex-col items-center text-center gap-1 w-1/3 px-1">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center">
                   <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/icon-returns._CB484059092_.png" alt="Returns" className="w-8 h-8 object-contain" />
                 </div>
                 <span className="text-[11px] text-[#007185] leading-tight">7 days Replacement</span>
               </div>
               <div className="flex flex-col items-center text-center gap-1 w-1/3 px-1">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center">
                   <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/icon-amazon-delivered._CB485933725_.png" alt="Delivery" className="w-8 h-8 object-contain" />
                 </div>
                 <span className="text-[11px] text-[#007185] leading-tight">Secure Delivery</span>
               </div>
               <div className="flex flex-col items-center text-center gap-1 w-1/3 px-1">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center">
                   <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/Secure-payment._CB650126890_.png" alt="Secure" className="w-8 h-8 object-contain" />
                 </div>
                 <span className="text-[11px] text-[#007185] leading-tight">Secure Transaction</span>
               </div>
            </div>

            <hr className="border-gray-200 my-2" />

            {/* Product Specifications Table */}
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {product.sku && (
                  <>
                    <div className="font-bold text-[#0F1111]">SKU</div>
                    <div className="text-gray-700">{product.sku}</div>
                  </>
                )}
                {product.weight && (
                  <>
                    <div className="font-bold text-[#0F1111]">Item Weight</div>
                    <div className="text-gray-700">{product.weight} kg</div>
                  </>
                )}
                {product.dimensions && (
                  <>
                    <div className="font-bold text-[#0F1111]">Dimensions</div>
                    <div className="text-gray-700">{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</div>
                  </>
                )}
              </div>
            </div>

            <hr className="border-gray-200 my-4" />

            {/* Description / About this item */}
            <div className="pt-2">
              <h2 className="text-base font-bold text-[#0F1111] mb-2">About this item</h2>
              <div className="text-sm text-[#0F1111] leading-relaxed whitespace-pre-wrap pl-4 relative">
                 <ul className="list-disc space-y-2 marker:text-gray-400">
                    {product.description ? (
                      product.description.split('\n').filter(Boolean).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))
                    ) : (
                      <li>Premium quality packaging material.</li>
                    )}
                 </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Buy Box */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-[0_0_10px_rgba(0,0,0,0.05)] flex flex-col gap-4">
              
              <div className="flex items-baseline gap-1">
                 <span className="text-[28px] font-medium text-[#0F1111] leading-none">{formatCurrency(sellingPrice)}</span>
              </div>

              <div>
                <p className="text-sm text-[#0F1111]">
                  FREE delivery <span className="font-bold">Today/Tomorrow</span>.
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Deliver to all over India</span>
                </div>
              </div>

              <div className="text-lg font-medium text-[#007600]">
                {hasStock ? 'In stock' : <span className="text-[#B12704]">Currently unavailable</span>}
              </div>

              {hasStock && (
                <div className="mt-2">
                  <AddToCartButton 
                    product={{
                      ...product,
                      category_id: product.category_id,
                    }} 
                    showQuantitySelector={true}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 text-sm text-[#007185] cursor-pointer group">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="group-hover:text-[#C7511F] group-hover:underline">Secure transaction</span>
              </div>

              <div className="text-sm space-y-1 mt-1">
                <div className="flex gap-4">
                  <span className="text-gray-500 w-16">Ships from</span>
                  <span className="text-[#0F1111]">{siteConfig.shortName}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-16">Sold by</span>
                  <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">{siteConfig.shortName}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Separator before Related */}
        <hr className="border-gray-200 my-10 md:my-16" />

        {/* Related Products Carousel */}
        <RelatedProducts 
          currentProductId={product.id} 
          categoryId={product.category_id} 
        />
      </Container>
    </div>
  )
}