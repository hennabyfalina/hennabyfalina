// src/components/product/ProductInteractiveSection.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Lock, RefreshCw, Truck, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { siteConfig } from '@/config/site'
import { B2B_CONSTANTS } from '@/config/b2b-rules'
import ProductWishlistButton from './ProductWishlistButton'
import ShareButton from './ShareButton'
import StarRating from './StarRating'
import PrintingOptions from './PrintingOptions'
import AddToCartButton from './AddToCartButton'
import { useProductDraftStore, ProductDraft } from '@/store/productDraft.store'
import { useCartStore } from '@/store/cart.store'
import { ClientOnly } from '@/components/ui/ClientOnly'

interface ProductInteractiveSectionProps {
  product: any
  hasStock: boolean
  sellingPrice: number
  regularPrice: number
  discountPercentage: number
}

const getDefaultDraft = (product: any): ProductDraft => ({
  printingType: 'Retail (Readymade)',
  instructions: '',
  artworkUrls: [],
  artworks: [],
  isAgreementChecked: true,
  minQty: B2B_CONSTANTS.RETAIL_MIN_QTY,
  days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS,
})

export default function ProductInteractiveSection({
  product,
  hasStock,
  sellingPrice,
  regularPrice,
  discountPercentage,
}: ProductInteractiveSectionProps) {
  const getDraft = useProductDraftStore((state) => state.getDraft)
  const setDraft = useProductDraftStore((state) => state.setDraft)
  const hydrateFromCart = useProductDraftStore((state) => state.hydrateFromCart)
  const cartItems = useCartStore((state) => state.items)
  const findCartItem = useCartStore((state) => state.findCartItem)

  const [b2bState, setB2bState] = useState<ProductDraft>(() => {
    // 1. First check: saved draft (highest priority)
    const savedDraft = getDraft(product.id)
    if (savedDraft) return savedDraft

    // 2. Second check: cart item
    // We need to decide which printing type to show if multiple exist
    // Default to the first one found, or the most common
    const cartItem = findCartItem(product.id, 'Retail (Readymade)') ||
                     findCartItem(product.id, 'Wholesale (No Print)') ||
                     findCartItem(product.id, 'Wholesale (Single Color)') ||
                     findCartItem(product.id, 'Wholesale (Multi Color)')
    
    if (cartItem) {
      return {
        printingType: cartItem.printing_type || 'Retail (Readymade)',
        instructions: cartItem.printing_instructions || '',
        artworkUrls: cartItem.artwork_urls || [],
        artworks: [],
        isAgreementChecked: true,
        minQty: cartItem.quantity >= B2B_CONSTANTS.WHOLESALE_MIN_QTY
          ? B2B_CONSTANTS.WHOLESALE_MIN_QTY
          : B2B_CONSTANTS.RETAIL_MIN_QTY,
        days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS,
        hydratedFromCart: true,
      }
    }

    // 3. Default
    return getDefaultDraft(product)
  })
  
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const saved = getDraft(product.id)
    if (saved) {
      setB2bState(saved)
    } else {
      // If no saved draft, try to hydrate from cart
      const cartItem = findCartItem(product.id, b2bState.printingType)
      if (cartItem && !b2bState.hydratedFromCart) {
        hydrateFromCart(product.id, cartItem)
        setB2bState({
          printingType: cartItem.printing_type || 'Retail (Readymade)',
          instructions: cartItem.printing_instructions || '',
          artworkUrls: cartItem.artwork_urls || [],
          artworks: [],
          isAgreementChecked: true,
          minQty: cartItem.quantity >= B2B_CONSTANTS.WHOLESALE_MIN_QTY
            ? B2B_CONSTANTS.WHOLESALE_MIN_QTY
            : B2B_CONSTANTS.RETAIL_MIN_QTY,
          days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS,
          hydratedFromCart: true,
        })
      }
    }
  }, [product.id, cartItems, findCartItem])

  // Persist every change
  useEffect(() => {
    setDraft(product.id, b2bState)
  }, [b2bState, product.id, setDraft])

  // Show restoration message after login redirect
  useEffect(() => {
    if (b2bState.redirectedForLogin) {
      // showToast('Your customisation details were restored. Please re‑upload your artwork.', 'info')
      setDraft(product.id, { ...b2bState, redirectedForLogin: false })
    }
  }, [])

  // Price calculation with hydration safety
  let activePrice = sellingPrice
  if (isClient) {
    const shouldUseBulkPrice = product.bulk_price &&
      b2bState.minQty >= (product.bulk_min_quantity || B2B_CONSTANTS.WHOLESALE_MIN_QTY)
    if (shouldUseBulkPrice) {
      activePrice = product.bulk_price
    }
  }

  // Transform b2bState to the shape expected by PrintingOptions
  const printingOptionsState = {
    type: b2bState.printingType,
    minQty: b2bState.minQty,
    days: b2bState.days,
    instructions: b2bState.instructions,
    artworkUrls: b2bState.artworkUrls,
    artworks: b2bState.artworks,
    isAgreementChecked: b2bState.isAgreementChecked,
  }

  const handlePrintingOptionsChange = (newState: any) => {
    setB2bState({
      ...b2bState,
      printingType: newState.type,
      minQty: newState.minQty,
      days: newState.days,
      instructions: newState.instructions,
      artworkUrls: newState.artworkUrls,
      artworks: newState.artworks,
      isAgreementChecked: newState.isAgreementChecked,
      hydratedFromCart: false, // User changed something, so it's no longer from cart
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8">
      {/* Middle Column */}
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

          <div className="text-xs sm:text-sm text-gray-500">
            M.R.P.: <span className="line-through">{formatCurrency(regularPrice)}</span>
          </div>
          <div className="text-sm font-semibold text-[#0F1111] mt-1">
            Inclusive of 18% GST
          </div>
        </div>

        {/* B2B Customization Engine - Wrapped in ClientOnly to prevent hydration mismatch */}
        {hasStock && (
          <div className="mt-4 scroll-mt-24" id="b2b-options">
            <ClientOnly fallback={<div className="h-32 bg-gray-50 animate-pulse rounded-lg" />}>
              <PrintingOptions
                b2bState={printingOptionsState}
                onChange={handlePrintingOptionsChange}
              />
            </ClientOnly>
          </div>
        )}

        <hr className="border-gray-200 my-4" />

        {/* Trust Icons Row - Now using local Lucide icons */}
        <div className="flex justify-around items-start py-2 w-full max-w-md mx-auto lg:mx-0">
          <div className="flex flex-col items-center text-center gap-2 px-2 flex-1 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] sm:text-xs text-[#007185] leading-tight font-medium group-hover:text-[#C7511F] transition-colors">
              B2B Returns Policy
            </span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 px-2 flex-1 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <Truck className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] sm:text-xs text-[#007185] leading-tight font-medium group-hover:text-[#C7511F] transition-colors">
              Factory Dispatched
            </span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 px-2 flex-1 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <ShieldCheck className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] sm:text-xs text-[#007185] leading-tight font-medium group-hover:text-[#C7511F] transition-colors">
              Secure Transaction
            </span>
          </div>
        </div>

        <hr className="border-gray-200 my-4" />

        {/* Product Specifications Table */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
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
                <div className="text-gray-700">
                  {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm
                </div>
              </>
            )}
          </div>
        </div>

        <hr className="border-gray-200 my-4" />

        {/* About this item */}
        <div className="pt-2">
          <h2 className="text-base font-bold text-[#0F1111] mb-2">About this item</h2>
          <ul className="list-disc space-y-2 marker:text-gray-800 pl-4 text-sm sm:text-base text-[#0F1111]">
            {product.description ? (
              product.description.split('\n').filter(Boolean).map((line: string, i: number) => (
                <li key={i}>{line}</li>
              ))
            ) : (
              <li>Premium B2B quality packaging material.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Right Column: Buy Box */}
      <div className="lg:col-span-3">
        <div className="border border-gray-300 rounded-lg p-4 sm:p-5 bg-white shadow-sm flex flex-col gap-4 sticky top-28">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-[28px] font-medium text-[#0F1111] leading-none">
              {formatCurrency(activePrice)}
            </span>
            <span className="text-sm text-gray-500">/ unit</span>
          </div>

          {/* 🆕 Show indicator if product is already in cart – wrapped in ClientOnly */}
          <ClientOnly>
            {findCartItem(product.id, b2bState.printingType) && (
              <div className="text-xs text-green-700 bg-green-50 p-2 rounded-md mb-1 border border-green-200">
                ✓ Already in cart. Updating will modify your existing item.
              </div>
            )}
          </ClientOnly>

          <div>
            <p className="text-sm text-[#0F1111]">
              Estimated dispatch in{' '}
              <ClientOnly fallback={<span className="font-bold">7 Days</span>}>
                <span className="font-bold">{b2bState.days} Days</span>
              </ClientOnly>
              .
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>Deliver to all over India</span>
            </div>
          </div>

          <div>
            {hasStock ? (
              <>
                <span className="text-lg font-medium text-[#007600]">In Stock</span>
                {product.stock <= 50 && (
                  <p className="text-sm font-bold text-[#B12704] mt-1">
                    Only {product.stock} left in stock - order soon.
                  </p>
                )}
              </>
            ) : (
              <span className="text-lg font-medium text-[#B12704]">Currently unavailable</span>
            )}
          </div>

          {hasStock && (
            <div className="mt-2">
              <AddToCartButton
                product={product}
                showQuantitySelector={true}
                minQuantity={b2bState.minQty}
                printingType={b2bState.printingType}
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