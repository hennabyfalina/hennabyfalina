// src/components/product/ProductInteractiveSection.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { siteConfig } from '@/config/site'
import { B2B_CONSTANTS } from '@/config/b2b-rules'
import ProductWishlistButton from './ProductWishlistButton'
import ShareButton from './ShareButton'
import StarRating from './StarRating'
import PrintingOptions from './PrintingOptions'
import AddToCartButton from './AddToCartButton'

interface ProductInteractiveSectionProps {
  product: any
  hasStock: boolean
  sellingPrice: number
  regularPrice: number
  discountPercentage: number
}

export default function ProductInteractiveSection({
  product,
  hasStock,
  sellingPrice,
  regularPrice,
  discountPercentage
}: ProductInteractiveSectionProps) {
  
  // 🚨 HYDRATION: Restore B2B state from session storage if available
  const [b2bState, setB2bState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`b2b_state_${product.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          parsed.artworkUrls = parsed.artworkUrls || []
          parsed.artworks = parsed.artworks || []
          return parsed
        } catch (e) {}
      }
    }
    return {
      type: 'Retail (Readymade)',
      minQty: B2B_CONSTANTS.RETAIL_MIN_QTY,
      days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS,
      instructions: '',
      artworkUrls: [] as string[],
      artworks: [] as any[],
      isAgreementChecked: true
    }
  })

  useEffect(() => {
    sessionStorage.setItem(`b2b_state_${product.id}`, JSON.stringify(b2bState))
  }, [b2bState, product.id])

  const activePrice = product.bulk_price && b2bState.minQty >= (product.bulk_min_quantity || B2B_CONSTANTS.WHOLESALE_MIN_QTY) 
    ? product.bulk_price 
    : sellingPrice

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8">
      
      {/* ========================================= */}
      {/* MIDDLE COLUMN: Details & Customization    */}
      {/* ========================================= */}
      <div className="lg:col-span-4 space-y-3">
        <div>
          <h1 className="text-xl sm:text-[22px] leading-tight font-medium text-[#0F1111] mb-1">
            {product.name}
          </h1>
          <div className="flex items-center justify-between">
            <Link href="/products" className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline">
              Visit the {siteConfig.shortName} Store
            </Link>
            <div className="flex items-center gap-3 [&_button]:cursor-pointer">
              <ProductWishlistButton productId={product.id} />
              <ShareButton productName={product.name} productSlug={product.slug} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2 mt-2">
            <StarRating rating={product.rating ?? 4.5} reviewCount={product.review_count ?? 128} size="md" />
          </div>
        </div>

        <hr className="border-gray-200 my-2" />

        {/* Price Section */}
        <div className="flex flex-col gap-1">
          {discountPercentage > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-light text-[#CC0C39]">-{discountPercentage}%</span>
              <span className="text-2xl sm:text-3xl font-medium text-[#0F1111]">{formatCurrency(activePrice)}</span>
            </div>
          )}
          {discountPercentage === 0 && (
            <span className="text-2xl sm:text-3xl font-medium text-[#0F1111]">{formatCurrency(activePrice)}</span>
          )}
          
          <div className="text-xs sm:text-sm text-gray-500">M.R.P.: <span className="line-through">{formatCurrency(regularPrice)}</span></div>
          <div className="text-sm font-semibold text-[#0F1111] mt-1">
            Inclusive of 18% GST <span className="font-normal text-gray-600 text-xs"></span>
          </div>
        </div>

        {/* B2B Customization Engine */}
        {hasStock && (
          <div className="mt-4 scroll-mt-24" id="b2b-options">
            <PrintingOptions 
              b2bState={b2bState}
              onChange={(newData) => setB2bState(newData)}
            />
          </div>
        )}

        <hr className="border-gray-200 my-4" />

        {/* Trust Icons Row */}
        <div className="flex justify-around items-start py-2 w-full max-w-md mx-auto lg:mx-0">
           <div className="flex flex-col items-center text-center gap-2 px-2 flex-1">
             <div className="w-10 h-10 rounded-full flex items-center justify-center">
               <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/icon-returns._CB484059092_.png" alt="Returns" className="w-8 h-8 object-contain" />
             </div>
             <span className="text-[11px] sm:text-xs text-[#007185] leading-tight font-medium hover:text-[#C7511F] cursor-pointer transition-colors">B2B Returns Policy</span>
           </div>
           <div className="flex flex-col items-center text-center gap-2 px-2 flex-1">
             <div className="w-10 h-10 rounded-full flex items-center justify-center">
               <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/icon-amazon-delivered._CB485933725_.png" alt="Delivery" className="w-8 h-8 object-contain" />
             </div>
             <span className="text-[11px] sm:text-xs text-[#007185] leading-tight font-medium hover:text-[#C7511F] cursor-pointer transition-colors">Factory Dispatched</span>
           </div>
           <div className="flex flex-col items-center text-center gap-2 px-2 flex-1">
             <div className="w-10 h-10 rounded-full flex items-center justify-center">
               <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/Secure-payment._CB650126890_.png" alt="Secure" className="w-8 h-8 object-contain" />
             </div>
             <span className="text-[11px] sm:text-xs text-[#007185] leading-tight font-medium hover:text-[#C7511F] cursor-pointer transition-colors">Secure Transaction</span>
           </div>
        </div>

        <hr className="border-gray-200 my-4" />

        {/* Product Specifications Table */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {product.sku && (
              <><div className="font-bold text-[#0F1111]">SKU</div><div className="text-gray-700">{product.sku}</div></>
            )}
            {product.weight && (
              <><div className="font-bold text-[#0F1111]">Item Weight</div><div className="text-gray-700">{product.weight} kg</div></>
            )}
            {product.dimensions && (
              <><div className="font-bold text-[#0F1111]">Dimensions</div><div className="text-gray-700">{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</div></>
            )}
          </div>
        </div>

        <hr className="border-gray-200 my-4" />

        {/* About this item */}
        <div className="pt-2">
          <h2 className="text-base font-bold text-[#0F1111] mb-2">About this item</h2>
          <ul className="list-disc space-y-2 marker:text-gray-800 pl-4 text-sm sm:text-base text-[#0F1111]">
            {product.description ? (
              product.description.split('\n').filter(Boolean).map((line: string, i: number) => <li key={i}>{line}</li>)
            ) : (
              <li>Premium B2B quality packaging material.</li>
            )}
          </ul>
        </div>
      </div>

      {/* ========================================= */}
      {/* RIGHT COLUMN: The Clean Buy Box           */}
      {/* ========================================= */}
      <div className="lg:col-span-3">
        <div className="border border-gray-300 rounded-lg p-4 sm:p-5 bg-white shadow-sm flex flex-col gap-4 sticky top-28">
          
          <div className="flex items-baseline gap-1">
             <span className="text-2xl sm:text-[28px] font-medium text-[#0F1111] leading-none">{formatCurrency(activePrice)}</span>
             <span className="text-sm text-gray-500">/ unit</span>
          </div>

          <div>
            <p className="text-sm text-[#0F1111]">
              Estimated dispatch in <span className="font-bold">{b2bState.days} Days</span>.
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>Deliver to all over India</span>
            </div>
          </div>

          <div className="text-lg font-medium text-[#007600]">
            {hasStock ? 'In Stock' : <span className="text-[#B12704]">Currently unavailable</span>}
          </div>

          {/* Add To Cart Button (Wired to B2B State) */}
          {hasStock && (
            <div className="mt-2">
              <AddToCartButton 
                product={product} 
                showQuantitySelector={true}
                minQuantity={b2bState.minQty}
                printingType={b2bState.type}
                // 🚨 UPGRADED TO ARRAY 🚨
                artworkUrls={b2bState.artworkUrls}
                printingInstructions={b2bState.instructions}
                isAgreementChecked={b2bState.isAgreementChecked}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 text-sm text-[#007185] cursor-pointer group">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="group-hover:text-[#C7511F] group-hover:underline">Secure transaction</span>
          </div>

          <div className="text-sm space-y-1 mt-2 text-[#0F1111]">
            <div className="flex gap-4">
              <span className="text-gray-500 w-16">Ships from</span>
              <span>{siteConfig.shortName}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-gray-500 w-16">Sold by</span>
              <span className="text-[#007185]">{siteConfig.shortName}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-gray-500 w-16">Tax Info</span>
              <span>18% GST Invoice provided</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}