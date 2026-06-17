// src/components/product/ProductInteractiveSection.tsx

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Leaf, Award, Shield, ArrowDown, ChevronDown, Check, Package, Tag, Minus, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ProductWishlistButton from './ProductWishlistButton'
import ShareButton from './ShareButton'
import StarRating from './StarRating'
import AddToCartButton from './AddToCartButton'
import BuyNowButton from './BuyNowButton'
import QuantitySelector from './QuantitySelector'
import { useCartStore } from '@/store/cart.store'
import { ClientOnly } from '@/components/ui/ClientOnly'
import { useVariantStore, type Variant } from '@/store/variant.store'
import { getEffectivePrice, isWholesaleActive, parseVariants } from '@/lib/pricing'

interface ProductInteractiveSectionProps {
  product: any
  hasStock: boolean
  sellingPrice?: number
}

export default function ProductInteractiveSection({ product, hasStock }: ProductInteractiveSectionProps) {
  const searchParams = useSearchParams()
  const editItemId = searchParams ? searchParams.get('edit_item') : null
  const cartItems = useCartStore((state) => state.items)
  const isValidEditItemId = editItemId && cartItems.some(i => i.id === editItemId) ? editItemId : null

  const { variants, selectedVariant, setVariants, setSelectedVariant } = useVariantStore()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<string | null>('experience')
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false)

  useEffect(() => {
    if (product.is_variants_enabled) {
      const productVariants = parseVariants(product.variants)
      setVariants(productVariants)
    } else {
      setVariants([])
    }
  }, [product.id, product.variants, product.is_variants_enabled, setVariants])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('[data-variant-select-container]')) {
        setIsVariantDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // 🛡️ DYNAMIC MIN QUANTITY GATEKEEPER: Fallback handler for nested matrices
  const minQuantity = (!product.is_retail_enabled && product.is_wholesale_enabled)
    ? (selectedVariant?.wholesale_min_qty ?? product.wholesale_min_qty ?? 1)
    : 1

  useEffect(() => {
    if (quantity < minQuantity) {
      setQuantity(minQuantity)
    }
  }, [minQuantity, quantity])

  const effectiveUnitPrice = getEffectivePrice(product, quantity, selectedVariant)
  const wholesaleActive = isWholesaleActive(product, quantity, selectedVariant)
  const totalPrice = effectiveUnitPrice * quantity

  const baseMrp = product.is_variants_enabled ? (selectedVariant?.variant_mrp ?? product.mrp) : product.mrp
  const discountPct = baseMrp && baseMrp > effectiveUnitPrice
    ? Math.round(((baseMrp - effectiveUnitPrice) / baseMrp) * 100)
    : 0

  useEffect(() => {
    if (isValidEditItemId) {
      const editItem = cartItems.find((item) => item.id === isValidEditItemId)
      if (editItem) setQuantity(editItem.quantity)
    }
  }, [isValidEditItemId, cartItems])

  const toggleTab = (tab: string) => setActiveTab(activeTab === tab ? null : tab)

  const getProductWithVariant = () => {
    return {
      ...product,
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price,
      wholesale_min_qty: product.wholesale_min_qty,
      is_retail_enabled: product.is_retail_enabled,
      is_wholesale_enabled: product.is_wholesale_enabled,
      is_variants_enabled: product.is_variants_enabled,
      name: product.name,
      variant_string: selectedVariant?.name || null,
      variants: product.variants,
      id: product.id,
      slug: product.slug,
      images: product.images,
      stock: product.stock,
      mrp: product.mrp,
    }
  }

  const hasWholesale = (variant: Variant | null) => {
    if (!variant) return false
    return !!(variant.wholesale_price || product.wholesale_price)
  }

  // ⚡ FIXED: Strategic fallbacks prevent text label formatting failures on variation profiles
  const resolvedWholesaleMinQty = selectedVariant?.wholesale_min_qty || product.wholesale_min_qty || 1
  const resolvedWholesalePrice = selectedVariant?.wholesale_price || product.wholesale_price || 0

  return (
    <div data-product-interactive className="w-full flex flex-col font-sans select-none animate-fade-in text-left">
      
      <div className="flex flex-col mb-5">
        <h1 className="text-3xl sm:text-4xl font-normal text-gray-950 tracking-tight leading-tight capitalize">
          {product.name.toLowerCase()}
        </h1>
        <div className="flex items-center gap-3 mt-4">
          <StarRating rating={product.rating ?? 4.5} reviewCount={product.review_count ?? 128} size="sm" />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-baseline gap-3 flex-wrap">
          {baseMrp && baseMrp > effectiveUnitPrice && (
            <span className="text-[24px] font-bold text-emerald-600 flex items-center">
              <ArrowDown className="w-5 h-5 mr-0.5" strokeWidth={3} />
              {discountPct}%
            </span>
          )}
          {baseMrp && baseMrp > effectiveUnitPrice && (
            <span className="text-[24px] font-normal text-gray-400 line-through">
              {formatCurrency(baseMrp)}
            </span>
          )}
          <span className="text-3xl font-bold text-gray-950">
            {formatCurrency(effectiveUnitPrice)}
          </span>
          {wholesaleActive && (
            <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2">
              <Tag className="w-3 h-3" />
              Bulk rate applied
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <ProductWishlistButton productId={product.id} />
          <ShareButton productName={product.name} productSlug={product.slug} />
        </div>
      </div>

      {product.is_variants_enabled && variants.length > 0 && (
        <div className="py-5 border-b border-gray-100 space-y-2 relative" data-variant-select-container>
          <span className="text-[13px] font-semibold text-gray-400 tracking-tight capitalize block">
            Select Size / Pack
          </span>
          
          <div className="relative w-fit">
            <button
              type="button"
              onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
              className="h-10 px-4 bg-white border border-gray-200 hover:border-gray-400 rounded-xl text-[13px] font-semibold text-gray-900 flex items-center gap-2 transition-all cursor-pointer outline-none shadow-none"
            >
              <span className="capitalize whitespace-nowrap">{selectedVariant ? selectedVariant.name.toLowerCase() : 'Choose an option'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isVariantDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            {isVariantDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-max min-w-full bg-white border border-gray-200 rounded-xl py-1 shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                {variants.map((v) => {
                  const isOptionSelected = selectedVariant?.name === v.name
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v)
                        setIsVariantDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center justify-between gap-4 cursor-pointer outline-none border-none ${
                        isOptionSelected 
                          ? 'bg-stone-50/80 text-gray-950 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="capitalize whitespace-nowrap">{v.name.toLowerCase()}</span>
                      {isOptionSelected && <Check className="w-3.5 h-3.5 text-gray-950" strokeWidth={2.5} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedVariant && product.is_wholesale_enabled && hasWholesale(selectedVariant) && (
            <div className="pt-1.5 flex items-center gap-1.5 text-[13px] text-emerald-600 font-semibold tracking-tight animate-fade-in">
              <Package className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
              <span>Buy {resolvedWholesaleMinQty}+ units to unlock {formatCurrency(resolvedWholesalePrice)}/each bulk rate</span>
            </div>
          )}
        </div>
      )}

      <div className="pt-1 pb-8 flex flex-col gap-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {hasStock ? (
            <>
              {product.stock <= 20 && (
                <span className="text-[16px] font-normal text-amber-700 flex items-center gap-1.5 lowercase">
                  <Package className="w-3.5 h-3.5" strokeWidth={1.5} /> only {product.stock} Units left
                </span>
              )}
            </>
          ) : (
            <span className="text-[13px] bg-red-50 text-red-800 font-normal px-3 py-1 rounded-full lowercase">sold out</span>
          )}
        </div>

        {/* Wholesale fallback banner checks */}
        {!product.is_variants_enabled && product.is_wholesale_enabled && product.wholesale_price && product.wholesale_min_qty && (
          <div className="inline-flex items-center gap-2 bg-emerald-50/50 border border-emerald-100/50 rounded-full px-4 py-2 w-fit">
            <Package className="w-3.5 h-3.5 text-emerald-700" strokeWidth={2} />
            <span className="text-[13px] font-normal text-emerald-900">
              Buy <span className="font-bold">{product.wholesale_min_qty}+</span> for 
              <span className="font-bold ml-1">{formatCurrency(product.wholesale_price)}/unit</span>
            </span>
          </div>
        )}

        {hasStock && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-medium text-gray-900 tracking-tight capitalize">Quantity</span>
                <div className="w-32 [&_button]:h-11 [&_div]:min-w-[40px] [&_div]:text-[15px]">
                  <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={minQuantity} max={product.stock} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[12px] font-normal text-gray-400 normal mb-0.5">Subtotal</span>
                <span className="text-2xl font-medium text-gray-950 tracking-tight">
                  {formatCurrency(totalPrice)}
                </span>
                {wholesaleActive && (
                  <span className="text-[11px] text-emerald-600 bg-emerald-50/60 px-2 py-0.5 rounded-full mt-1 lowercase">
                    {formatCurrency(effectiveUnitPrice)}/unit (bulk)
                  </span>
                )}
              </div>
            </div>

            <ClientOnly fallback={<div className="h-11 bg-stone-50 animate-pulse rounded-xl" />}>
              <div className="flex flex-row gap-3 mt-2 w-full">
                <div className="flex-1 relative [&_button]:h-12 [&_button]:rounded-full [&_button]:text-[13px] [&_button]:font-medium [&_button]:transition-all [&_button]:border-gray-200 [&_button]:hover:border-gray-400 [&_button]:shadow-none [&_button]:flex [&_button]:items-center [&_button]:justify-center">
                  <AddToCartButton
                    product={getProductWithVariant()}
                    showQuantitySelector={false}
                    showPriceInButton={true}
                    quantity={quantity}
                  />
                </div>
                <div className="flex-1 relative [&_button]:h-12 [&_button]:rounded-full [&_button]:text-[13px] [&_button]:font-medium [&_button]:bg-gray-950 [&_button]:hover:bg-black [&_button]:text-white [&_button]:transition-all [&_button]:shadow-none [&_button]:flex [&_button]:items-center [&_button]:justify-center">
                  <BuyNowButton product={getProductWithVariant()} quantity={quantity} />
                </div>
              </div>
            </ClientOnly>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-stone-50/60 flex items-center justify-center shrink-0 border border-gray-50">
            <Leaf className="w-3.5 h-3.5 text-emerald-800" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-normal text-gray-950 sm:truncate">100% pure</span>
            <span className="text-[14px] text-gray-400 sm:truncate">chemical free</span>
          </div>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-stone-50/60 flex items-center justify-center shrink-0 border border-gray-50">
            <Award className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-normal text-gray-950 sm:truncate">Premium</span>
            <span className="text-[14px] text-gray-400 sm:truncate">triple sifted</span>
          </div>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-stone-50/60 flex items-center justify-center shrink-0 border border-gray-50">
            <Shield className="w-3.5 h-3.5 text-stone-600" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-normal text-gray-950 sm:truncate">Certified</span>
            <span className="text-[14px] text-gray-400 sm:truncate">skin secure</span>
          </div>
        </div>
      </div>

      <div className="pt-2 space-y-0.5 pb-2">
        <div className="border-b border-gray-100 pb-3">
          <button type="button" onClick={() => toggleTab('experience')} className="w-full flex justify-between py-2 items-center text-left cursor-pointer group outline-none border-none bg-transparent">
            <span className="text-[16px] font-medium text-gray-950 transition-colors group-hover:text-black">Description</span>
            <span className="text-gray-400 shrink-0">{activeTab === 'experience' ? <Minus className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}</span>
          </button>
          <div className={`transition-all duration-300 overflow-hidden ${activeTab === 'experience' ? 'max-h-60 mt-1' : 'max-h-0'}`}>
            <p className="text-[16px] text-gray-500 font-normal leading-relaxed">
              {product.description || "Freshly batch-made utilizing premium unadulterated botanical essences. Tailored meticulously for artists who prioritize supreme stain color velocity and precision flow outlines."}
            </p>
          </div>
        </div>
      </div>

      <div id="desktop-dock-scroll-trigger" className="h-px w-full mt-12" aria-hidden="true" />
    </div>
  )
}