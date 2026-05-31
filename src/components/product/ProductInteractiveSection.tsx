// src/components/product/ProductInteractiveSection.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MapPin, Lock, RefreshCw, Truck, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { siteConfig } from '@/config/site'
import ProductWishlistButton from './ProductWishlistButton'
import ShareButton from './ShareButton'
import StarRating from './StarRating'
import PrintingOptions from './PrintingOptions'
import AddToCartButton from './AddToCartButton'
import BuyNowButton from './BuyNowButton' // 🚨 RESTORED IMPORT
import { useProductDraftStore, ProductDraft } from '@/store/productDraft.store'
import { useCartStore } from '@/store/cart.store'
import { ClientOnly } from '@/components/ui/ClientOnly'
import { showToast } from '@/components/ui/Toast'
import { broadcast } from '@/lib/broadcast'

interface ProductInteractiveSectionProps {
  product: any
  hasStock: boolean
  sellingPrice?: number
  regularPrice?: number
  discountPercentage?: number
}

export default function ProductInteractiveSection({
  product,
  hasStock,
}: ProductInteractiveSectionProps) {
  const searchParams = useSearchParams()
  const editItemId = searchParams ? searchParams.get('edit_item') : null

  const getDraft = useProductDraftStore((state) => state.getDraft)
  const setDraft = useProductDraftStore((state) => state.setDraft)
  const clearDraft = useProductDraftStore((state) => state.clearDraft)
  const cartItems = useCartStore((state) => state.items)
  const findCartItem = useCartStore((state) => state.findCartItem)

  const isValidEditItemId = editItemId && cartItems.some(i => i.id === editItemId) ? editItemId : null

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeTiers = product.pricing_tiers && product.pricing_tiers.length > 0 
    ? product.pricing_tiers 
    : [{ tier_name: 'Retail (Readymade)', mrp: product.price || 0, selling_price: product.selling_price || product.price || 0, min_quantity: 1, requires_artwork: false, delivery_days: 7, sort_order: 0 }];

  const defaultTier = activeTiers[0];

  const getDefaultDraft = (): ProductDraft => ({
    printingType: defaultTier.tier_name,
    instructions: '',
    artworkUrls: [],
    artworkSizes: [],
    artworks: [],
    isArtworkRightsChecked: false,
    isPrintTimelineChecked: false,
    minQty: defaultTier.min_quantity,
    days: defaultTier.delivery_days ?? 7,
    lastUpdated: 0
  })

  const [b2bState, setB2bState] = useState<any>(getDefaultDraft())
  const [isClient, setIsClient] = useState(false)
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null)
  const [hasStaleDraft, setHasStaleDraft] = useState(false)

  const handlePrintingOptionsChange = useCallback((newState: any) => {
    setB2bState((prevState: any) => ({
      ...prevState,
      printingType: newState.printingType || newState.type || prevState.printingType,
      minQty: newState.minQty ?? prevState.minQty,
      days: newState.days ?? prevState.days,
      instructions: newState.instructions !== undefined ? newState.instructions : prevState.instructions,
      artworkUrls: newState.artworkUrls ?? prevState.artworkUrls,
      artworkSizes: newState.artworkSizes ?? prevState.artworkSizes,
      artworks: newState.artworks ?? prevState.artworks,
      isArtworkRightsChecked: newState.isArtworkRightsChecked !== undefined ? newState.isArtworkRightsChecked : prevState.isArtworkRightsChecked,
      isPrintTimelineChecked: newState.isPrintTimelineChecked !== undefined ? newState.isPrintTimelineChecked : prevState.isPrintTimelineChecked,
      hydratedFromCart: true, 
    }))
  }, [])

  useEffect(() => {
    setIsClient(true)
    const savedDraft = getDraft(product.id)
    if (savedDraft) setB2bState(savedDraft)
  }, [product.id, getDraft])

  useEffect(() => {
    if (isValidEditItemId && cartItems.length > 0 && hydratedEditId !== isValidEditItemId) {
      const editItem = cartItems.find((item) => item.id === isValidEditItemId)
      if (editItem) {
        const tier = activeTiers.find((t: any) => t.tier_name === editItem.printing_type) || defaultTier

        const reconstructedArtworks = (editItem.artwork_urls || []).map((path, idx) => ({
          path: path,
          url: `/api/artwork?path=${encodeURIComponent(path)}`,
          name: path.split('/').pop() || `File ${idx + 1}`,
          size: editItem.artwork_sizes?.[idx] || 0
        }))

        setB2bState({
          printingType: editItem.printing_type || defaultTier.tier_name,
          instructions: editItem.printing_instructions || '',
          artworkUrls: editItem.artwork_urls || [],
          artworkSizes: editItem.artwork_sizes || [],
          artworks: reconstructedArtworks, 
          isArtworkRightsChecked: true,
          isPrintTimelineChecked: true,
          minQty: tier.min_quantity,
          days: tier.delivery_days ?? 7,
          hydratedFromCart: true,
        })
        setHydratedEditId(isValidEditItemId)
      }
    }
  }, [isValidEditItemId, cartItems, hydratedEditId, activeTiers, defaultTier])

  useEffect(() => {
    if (isClient) {
      setDraft(product.id, b2bState)
    }
  }, [b2bState, product.id, setDraft, isClient])

  // Add inside the component, after existing useEffects
  useEffect(() => {
    if (!isClient) return

    const validateArtworks = async () => {
      // Check if any artwork URLs are broken
      const currentArtworks = b2bState.artworks || []
      const validArtworks = []
      let hasInvalid = false

      for (const artwork of currentArtworks) {
        try {
          const response = await fetch(artwork.url, { method: 'HEAD' })
          if (response.ok) {
            validArtworks.push(artwork)
          } else {
            hasInvalid = true
            console.log(`Artwork missing: ${artwork.path}`)
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          hasInvalid = true
        }
      }

      if (hasInvalid && validArtworks.length !== currentArtworks.length) {
        // Update state with only valid artworks
        handlePrintingOptionsChange({
          ...b2bState,
          artworks: validArtworks,
          artworkUrls: validArtworks.map((a: any) => a.path),
          artworkSizes: validArtworks.map((a: any) => a.size),
        })
        showToast('Some artwork files are no longer available and have been removed.', 'warning')
      }
    }

    // Validate when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateArtworks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also validate on mount
    validateArtworks()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, b2bState.artworks])

  useEffect(() => {
    if (!isClient) return

    // Listen for cart item deletions in other tabs
    const unsubscribeItemDeleted = broadcast.on('CART_ITEM_DELETED', (data) => {
      if (data.productId === product.id) {
        // Clear the draft for this product
        clearDraft(product.id)
        
        // Reset local state
        setB2bState(getDefaultDraft())
        showToast('This item was removed from your cart in another tab.', 'info')
      }
    })

    // Listen for artwork deletions
    const unsubscribeArtworkDeleted = broadcast.on('ARTWORK_DELETED', (data) => {
      const currentArtworks = b2bState.artworks || []
      const pathsToDelete = new Set(data.paths)
      
      const remainingArtworks = currentArtworks.filter((a: any) => !pathsToDelete.has(a.path))
      
      if (remainingArtworks.length !== currentArtworks.length) {
        handlePrintingOptionsChange({
          ...b2bState,
          artworks: remainingArtworks,
          artworkUrls: remainingArtworks.map((a: any) => a.path),
          artworkSizes: remainingArtworks.map((a: any) => a.size),
        })
        showToast('Some artwork files were deleted in another tab.', 'warning')
      }
    })

    return () => {
      unsubscribeItemDeleted()
      unsubscribeArtworkDeleted()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, product.id, b2bState, handlePrintingOptionsChange])

  useEffect(() => {
    if (!isClient) return

    const unsubscribeItemUpdated = broadcast.on('CART_ITEM_UPDATED', (data) => {
      if (data.productId === product.id && !isValidEditItemId) {
        setHasStaleDraft(true)
        // Show subtle notification that cart changed elsewhere
        showToast('This item was updated in another tab. Your local draft may be outdated.', 'info')
      }
    })

    return () => unsubscribeItemUpdated()
  }, [isClient, product.id, isValidEditItemId])

  // 🚨 PHASE 6: Always derive active price from the selected tier
  const selectedTier = activeTiers.find((t: any) => t.tier_name === b2bState.printingType) || defaultTier
  const activePrice = selectedTier.selling_price
  const activeRegularPrice = selectedTier.mrp || product.price || 0
  const activeDiscountPercentage = activeRegularPrice > activePrice ? Math.round(((activeRegularPrice - activePrice) / activeRegularPrice) * 100) : 0

  // Check if there's a cart item matching the current draft's printing type
  const cartItemForDraft = useCartStore((state) =>
    state.findCartItem(product.id, b2bState.printingType)
  )

  // Compare draft vs cart (only if cart item exists and we are not in edit mode)
  const hasUnsavedChanges = !isValidEditItemId && cartItemForDraft && (
    cartItemForDraft.printing_type !== b2bState.printingType ||
    cartItemForDraft.quantity !== b2bState.minQty ||
    JSON.stringify(cartItemForDraft.artwork_urls || []) !== JSON.stringify(b2bState.artworkUrls) ||
    (cartItemForDraft.printing_instructions || '') !== (b2bState.instructions || '')
  )

  const resetDraftFromCart = () => {
    if (!cartItemForDraft) return

    const reconstructedArtworks = (cartItemForDraft.artwork_urls || []).map((path, idx) => ({
      path: path,
      url: `/api/artwork?path=${encodeURIComponent(path)}`,
      name: path.split('/').pop() || `File ${idx + 1}`,
      size: cartItemForDraft.artwork_sizes?.[idx] || 0
    }))

    const tier = product.pricing_tiers?.find((t: any) => t.tier_name === cartItemForDraft.printing_type) || activeTiers[0]

    setB2bState({
      printingType: cartItemForDraft.printing_type || defaultTier.tier_name,
      instructions: cartItemForDraft.printing_instructions || '',
      artworkUrls: cartItemForDraft.artwork_urls || [],
      artworkSizes: cartItemForDraft.artwork_sizes || [],
      artworks: reconstructedArtworks,
      isArtworkRightsChecked: tier?.requires_artwork ? true : false, // assume true for existing custom items
      isPrintTimelineChecked: tier?.requires_artwork ? true : false,
      minQty: cartItemForDraft.quantity,
      days: tier?.delivery_days ?? 7,
      hydratedFromCart: true,
    })
    showToast('Draft reset to cart version', 'info')
  }

  return (
    <div data-product-interactive className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8">
      <div className="lg:col-span-4 space-y-3">
        <div>
          <h1 className="text-xl sm:text-[22px] leading-tight font-medium text-[#0F1111] mb-1">
            {product.name}
          </h1>
          {hasStaleDraft && (
            <div className="mt-2 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
              <span className="font-medium text-amber-800">Draft may be outdated</span>
              <p className="text-xs text-amber-700 mt-0.5">
                This product was modified in another tab. 
                <button 
                  onClick={() => window.location.reload()} 
                  className="ml-2 text-amber-900 underline font-medium cursor-pointer"
                >
                  Refresh to see latest
                </button>
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Link href="/products" className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline">
              Visit the {siteConfig.shortName} Store
            </Link>
            <div className="flex items-center gap-3 [&_button]:cursor-pointer">
              <ProductWishlistButton productId={product.id} />
              <ShareButton productName={product.name} productSlug={product.slug} />
            </div>
          </div>
        <ClientOnly>
          {hasUnsavedChanges && !hasStaleDraft && (
            <div className="mt-2 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-blue-800">Unsaved changes</span>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Your local draft differs from the item in your cart.
                  </p>
                </div>
                <button
                  onClick={resetDraftFromCart}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-blue-300 text-blue-800 rounded-full hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Reset to Cart
                </button>
              </div>
            </div>
          )}
        </ClientOnly>
          <div className="flex items-center gap-2 mb-2 mt-2">
            <StarRating rating={product.rating ?? 4.5} reviewCount={product.review_count ?? 128} size="md" />
          </div>
        </div>

        <hr className="border-gray-200 my-2" />

        {/* Pricing Display */}
        <div className="flex flex-col gap-1">
          <ClientOnly fallback={<div className="h-10 w-32 bg-gray-100 animate-pulse rounded" />}>
            <div className="flex items-baseline gap-2">
               {activeDiscountPercentage > 0 && (
                <span className="text-2xl sm:text-3xl font-light text-[#CC0C39]">-{activeDiscountPercentage}%</span>
              )}
              <span className="text-2xl sm:text-3xl font-medium text-[#0F1111]">{formatCurrency(activePrice)}</span>
            </div>
          </ClientOnly>

          <div className="text-xs sm:text-sm text-gray-500">
            M.R.P.: <span className="line-through">{formatCurrency(activeRegularPrice)}</span>
          </div>
          <div className="text-sm font-semibold text-[#0F1111] mt-1">
            Inclusive of 18% GST
          </div>
        </div>

        {hasStock && (
          <div className="mt-4 scroll-mt-24" id="b2b-options">
            <ClientOnly fallback={<div className="h-32 bg-gray-50 animate-pulse rounded-lg" />}>
              <PrintingOptions
                b2bState={b2bState}
                onChange={handlePrintingOptionsChange}
                pricingTiers={activeTiers}
              />
            </ClientOnly>
          </div>
        )}

        <hr className="border-gray-200 my-4" />

        {/* Delivery Badges */}
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

        {/* Specifications */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {product.sku && (
              <><div className="font-bold text-[#0F1111]">SKU</div><div className="text-gray-700">{product.sku}</div></>
            )}
            {product.weight && (
              <><div className="font-bold text-[#0F1111]">Item Weight</div><div className="text-gray-700">{product.weight} {product.weight_unit || 'kg'}</div></>
            )}
            {product.gsm && (
              <><div className="font-bold text-[#0F1111]">Thickness (GSM)</div><div className="text-gray-700">{product.gsm}</div></>
            )}
            {product.dimensions && (
              <><div className="font-bold text-[#0F1111]">Dimensions</div><div className="text-gray-700">{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</div></>
            )}
          </div>
        </div>

        <hr className="border-gray-200 my-4" />

        <div className="pt-2">
          <h2 className="text-base font-bold text-[#0F1111] mb-2">About this item</h2>
          <ul className="list-disc space-y-2 marker:text-gray-800 pl-4 text-sm sm:text-base text-[#0F1111]">
            {product.description ? product.description.split('\n').filter(Boolean).map((line: string, i: number) => <li key={i}>{line}</li>) : <li>Premium B2B quality packaging.</li>}
          </ul>
        </div>
      </div>

      {/* 🚨 SIDEBAR ACTION BOX 🚨 */}
      <div id="product-action-box" className="lg:col-span-3">
        <div className="border border-gray-300 rounded-lg p-4 sm:p-5 bg-white shadow-sm flex flex-col gap-4 sticky top-28">
          <div className="flex items-baseline gap-1" suppressHydrationWarning>
            <span className="text-2xl sm:text-[28px] font-medium text-[#0F1111] leading-none">
              {formatCurrency(activePrice)}
            </span>
            <span className="text-sm text-gray-500">/ unit</span>
          </div>

          <ClientOnly>
            {findCartItem(product.id, b2bState.printingType) && !isValidEditItemId && (
              <div className="text-xs text-green-700 bg-green-50 p-2 rounded-md mb-1 border border-green-200">
                Already in cart. Updating will modify your existing item.
              </div>
            )}
            {isValidEditItemId && (
              <div className="text-xs text-[#007185] bg-[#F0F8FF] p-2 rounded-md mb-1 border border-[#007185]/20 font-medium">
                You are modifying an item currently in your cart.
              </div>
            )}
          </ClientOnly>

          <div>
            <p className="text-sm text-[#0F1111]">
              Estimated dispatch in{' '}
              <span className="font-bold">{selectedTier.delivery_days ?? 7} Days</span>.
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
                  <p className="text-sm font-bold text-[#B12704] mt-1">Only {product.stock} left in stock.</p>
                )}
              </>
            ) : (
              <span className="text-lg font-medium text-[#B12704]">Currently unavailable</span>
            )}
          </div>

          {hasStock && (
            <div className="mt-2 flex flex-col gap-3">
              {/* 🚨 WRAPPED IN CLIENT ONLY TO STOP QUANTITY MISMATCH ERROR */}
              <ClientOnly fallback={<div className="h-24 bg-gray-100 animate-pulse rounded-lg" />}>
                <AddToCartButton
                  product={product}
                  showQuantitySelector={true}
                  minQuantity={selectedTier.min_quantity}
                  printingType={b2bState.printingType}
                  artworkUrls={b2bState.artworkUrls}
                  artworkSizes={b2bState.artworkSizes}
                  printingInstructions={b2bState.instructions}
                  isArtworkRightsChecked={b2bState.isArtworkRightsChecked}
                  isPrintTimelineChecked={b2bState.isPrintTimelineChecked}
                  editItemId={isValidEditItemId}
                />
                {/* 🚨 RESTORED BUY NOW BUTTON / CANCEL EDIT BUTTON */}
                {!isValidEditItemId ? (
                  <BuyNowButton
                    product={product}
                    quantity={selectedTier.min_quantity}
                    printingType={b2bState.printingType}
                    artworkUrls={b2bState.artworkUrls}
                    artworkSizes={b2bState.artworkSizes}
                    printingInstructions={b2bState.instructions}
                    isArtworkRightsChecked={b2bState.isArtworkRightsChecked}
                    isPrintTimelineChecked={b2bState.isPrintTimelineChecked}
                  />
                  ) : (
                  <Link
                    href="/cart"
                    className="w-full h-11 flex items-center justify-center gap-2 text-[15px] font-medium bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-full shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancel Edit
                  </Link>
                )}
              </ClientOnly>
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
          </div>
        </div>
      </div>
      {/* 🚨 THE TRIPWIRE: Moved below the Action Box so the sticky bar ONLY appears after scrolling past the Buy buttons! */}
      <div id="buy-box-trigger" className="h-1 w-full mt-2" aria-hidden="true" />
    </div>
  )
}