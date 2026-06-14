// src/components/product/ProductActionDock.tsx

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import AddToCartButton from './AddToCartButton'
import QuantitySelector from './QuantitySelector'
import { useVariantStore, type Variant } from '@/store/variant.store'
import { getComputedProductPrices, getEffectivePrice, isWholesaleActive } from '@/lib/pricing'

interface ProductActionDockProps {
  product: any
  sellingPrice: number
  hasStock: boolean
}

export default function ProductActionDock({ product, sellingPrice, hasStock }: ProductActionDockProps) {
  const [shouldShow, setShouldShow] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const { variants, selectedVariant, setVariants, setSelectedVariant } = useVariantStore()

  // Parse variants
  useEffect(() => {
    let productVariants: Variant[] = []
    if (product.variants && typeof product.variants === 'string') {
      try { productVariants = JSON.parse(product.variants) } catch { productVariants = [] }
    } else if (Array.isArray(product.variants)) {
      productVariants = product.variants
    }
    setVariants(productVariants)
  }, [product.id, product.variants, setVariants])

  // Current effective price (real-time)
  const effectivePrice = getEffectivePrice(product, quantity, selectedVariant)

  // Get MRP and Discount data
  const { activeMrp, discountPct } = useCallback(() => {
    return getComputedProductPrices(product, selectedVariant)
  }, [product, selectedVariant])()

  // Check if wholesale is currently applied
  const isWholesaleApplied = isWholesaleActive(product, quantity, selectedVariant)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Simple scroll threshold detection
  useEffect(() => {
    if (!isMounted) return

    const getTargetOffset = () => {
      const trigger = document.getElementById('desktop-dock-scroll-trigger')
      if (trigger) {
        const rect = trigger.getBoundingClientRect()
        return window.scrollY + rect.top
      }
      return 1200
    }

    const handleScroll = () => {
      const threshold = getTargetOffset()
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setShouldShow(true)
        return
      }
      setShouldShow(window.scrollY > threshold)
    }

    setTimeout(handleScroll, 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isMounted, product.id])

  if (!isMounted) return null
  if (!hasStock) return null

  const imageUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : getPublicUrl(product.images[0]))
    : '/placeholder-product.svg'

  // Build product with the dynamic effective price (includes wholesale if applied)
  const getProductWithVariant = () => {
    return {
      ...product,
      retail_price: effectivePrice,  // ✅ dynamic price (retail or wholesale)
      name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      variant_name: selectedVariant?.name,
    };
  }

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-[160] bg-white border-t border-gray-100
        shadow-[0_-2px_10px_rgba(0,0,0,0.03)] transition-transform duration-300
        ${shouldShow ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <div className="px-4 py-3 mx-auto max-w-[1600px]">
        {/* Desktop layout (horizontal) */}
        <div className="hidden md:flex items-center justify-between gap-8 py-1">
          {/* Left: thumbnail + name + price + wholesale badge */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-14 h-14 relative shrink-0 bg-stone-50 rounded-full border border-gray-100 overflow-hidden shadow-sm">
              <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-lg font-medium text-gray-900 truncate capitalize leading-tight">
                {product.name.toLowerCase()}
              </h4>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {activeMrp && activeMrp > effectivePrice && (
                  <span className="text-[15px] text-gray-400 line-through font-normal">
                    {formatCurrency(activeMrp)}
                  </span>
                )}
                <span className="text-xl font-bold text-gray-950">
                  {formatCurrency(effectivePrice)}
                </span>
                {activeMrp && activeMrp > effectivePrice && (
                  <span className="text-[13px] font-bold text-emerald-600">
                    {discountPct}% off
                  </span>
                )}
                {!isWholesaleApplied && (
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">in stock</span>
                )}
                {isWholesaleApplied && (
                  <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    Bulk rate · {formatCurrency(effectivePrice)}/unit
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: variant dropdown (with wholesale hints) + quantity + add to cart */}
          <div className="flex items-center gap-6 shrink-0">
            {variants.length > 0 && (
              <select
                value={selectedVariant?.name || ''}
                aria-label="Select product variant"
                onChange={(e) => {
                  const variant = variants.find(v => v.name === e.target.value)
                  if (variant) setSelectedVariant(variant)
                }}
                className="h-11 px-4 border border-gray-200 rounded-full text-[15px] font-medium bg-white focus:outline-none focus:border-gray-950 transition-all cursor-pointer"
              >
                {variants.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} – {formatCurrency(v.price)}
                    {v.wholesale_price && v.wholesale_min_qty && ` (${v.wholesale_min_qty}+ → ${formatCurrency(v.wholesale_price)})`}
                  </option>
                ))}
              </select>
            )}
            <div className="[&_button]:h-10 [&_button]:w-10 [&_div]:min-w-[40px] [&_div]:text-base">
              <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={product.stock} />
            </div>
            <AddToCartButton
              product={getProductWithVariant()}
              quantity={quantity}
              showQuantitySelector={false}
              showPriceInButton={true}
              className="h-12 px-8 bg-gray-950 hover:bg-black text-white rounded-full text-[15px] font-bold tracking-wide whitespace-nowrap transition-all cursor-pointer shadow-md active:scale-[0.98]"
            />
          </div>
        </div>

        {/* Mobile layout (vertical) */}
        <div className="flex md:hidden flex-col gap-3">
          {/* Mobile wholesale badge (if active) */}
          {isWholesaleApplied && (
            <div className="text-[12px] font-medium text-emerald-700 bg-emerald-50/80 px-3 py-1 rounded-full self-start">
              Bulk rate: {formatCurrency(effectivePrice)}/unit
            </div>
          )}
          {variants.length > 0 && (
            <select
              value={selectedVariant?.name || ''}
              aria-label="Select product variant"
              onChange={(e) => {
                const variant = variants.find(v => v.name === e.target.value)
                if (variant) setSelectedVariant(variant)
              }}
              className="w-full h-10 px-4 border border-gray-200 rounded-xl text-sm font-normal bg-white"
            >
              {variants.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name} – {formatCurrency(v.price)}
                  {v.wholesale_price && v.wholesale_min_qty && ` (${v.wholesale_min_qty}+ → ${formatCurrency(v.wholesale_price)})`}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={product.stock} />
            </div>
            <div className="flex-1">
              <AddToCartButton
                product={getProductWithVariant()}
                quantity={quantity}
                showQuantitySelector={false}
                showPriceInButton={true}
                className="w-full h-11 bg-gray-950 text-white rounded-xl text-sm font-normal transition-all active:scale-[0.98] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}