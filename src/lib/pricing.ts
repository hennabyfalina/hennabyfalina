// src/lib/pricing.ts

import type { Product } from '@/types/database.types'

export interface ProductVariant {
  name: string
  price: number
  variant_mrp?: number | null
  wholesale_price?: number | null
  wholesale_min_qty?: number | null
}

/**
 * Safely parses the flexible product variants field from Supabase into a true typed array.
 */
export function parseVariants(variants: any): ProductVariant[] {
  if (!variants) return []
  if (typeof variants === 'string') {
    const trimmed = variants.trim()
    if (!trimmed) return []
    try {
      return JSON.parse(trimmed) as ProductVariant[]
    } catch {
      return []
    }
  }
  if (Array.isArray(variants)) {
    return variants as ProductVariant[]
  }
  return []
}

/**
 * Gets the base price or variant-specific price before wholesale modifiers apply.
 */
export function getVariantBasePrice(product: Product, variantName: string | null): number {
  if (product.is_variants_enabled) {
    const variants = parseVariants(product.variants)
    if (variantName) {
      const found = variants.find(v => v.name === variantName)
      if (found) return found.price
    }
    if (variants.length > 0) {
      return variants.reduce((min, v) => v.price < min ? v.price : min, variants[0].price)
    }
  }
  return product.is_retail_enabled ? (product.retail_price ?? 0) : 0
}

/**
 * Enrich product maps with variant details for responsive cart components.
 */
export function enrichProductWithVariant(product: Product, variant: ProductVariant | null) {
  if (!variant) return product
  
  return {
    ...product,
    retail_price: variant.price,
    mrp: variant.variant_mrp ?? product.mrp,
    name: `${product.name} (${variant.name})`,
    variant_name: variant.name,
    variant_price: variant.price,
    wholesale_price: variant.wholesale_price ?? product.wholesale_price,
    wholesale_min_qty: variant.wholesale_min_qty ?? product.wholesale_min_qty,
  }
}

/**
 * Atomic execution pass for computing product prices and discount states.
 */
export function getComputedProductPrices(product: Product, selectedVariant: ProductVariant | null) {
  const parsedVariants = parseVariants(product.variants)
  const hasVariants = product.is_variants_enabled && parsedVariants.length > 0

  const activeVariant = selectedVariant || (hasVariants
    ? parsedVariants.reduce((min, v) => v.price < min.price ? v : min, parsedVariants[0])
    : null)

  let displayPrice = product.is_retail_enabled ? (product.retail_price ?? 0) : 0
  if (product.is_variants_enabled && activeVariant) {
    displayPrice = activeVariant.price
  } else if (!product.is_retail_enabled && product.is_wholesale_enabled && product.wholesale_price) {
    displayPrice = product.wholesale_price 
  }
  
  const activeMrp = activeVariant?.variant_mrp || product.mrp || displayPrice

  const discountPct = activeMrp && activeMrp > displayPrice
    ? Math.round(((activeMrp - displayPrice) / activeMrp) * 100)
    : 0

  const isOutOfStock = (product.stock ?? 0) <= 0

  // ⚡ FIXED: Scan variant arrays for wholesale options if variants mode is active
  let isWholesaleAvailable = product.is_wholesale_enabled && product.wholesale_min_qty !== null && product.wholesale_min_qty > 0

  if (hasVariants && product.is_wholesale_enabled) {
    if (activeVariant) {
      const vMinQty = activeVariant.wholesale_min_qty ?? product.wholesale_min_qty
      const vPrice = activeVariant.wholesale_price ?? product.wholesale_price
      isWholesaleAvailable = !!(vMinQty && vPrice && vMinQty > 0)
    } else {
      isWholesaleAvailable = parsedVariants.some(v => 
        (v.wholesale_min_qty ?? product.wholesale_min_qty ?? 0) > 0 && 
        (v.wholesale_price ?? product.wholesale_price ?? 0) > 0
      )
    }
  }

  return {
    hasVariants,
    parsedVariants,
    displayPrice,
    discountPct,
    activeMrp,
    isOutOfStock,
    isWholesaleAvailable
  }
}

/**
 * 🔒 ZERO-TRUST PRICE RESOLVER ENGINE
 * Enforces pricing hierarchies at checkout and API integration thresholds.
 */
export function getEffectivePrice(
  product: Product,
  quantity: number,
  selectedVariant: ProductVariant | null = null
): number {
  if (product.is_variants_enabled) {
    const variants = parseVariants(product.variants)
    const activeVariant = selectedVariant || (variants.length > 0 ? variants.reduce((min, v) => v.price < min.price ? v : min, variants[0]) : null)
    
    if (activeVariant) {
      if (product.is_wholesale_enabled) {
        const vMinQty = activeVariant.wholesale_min_qty ?? product.wholesale_min_qty
        const vWholesalePrice = activeVariant.wholesale_price ?? product.wholesale_price
        
        if (vMinQty && vWholesalePrice && quantity >= vMinQty) {
          return vWholesalePrice
        }
      }
      return activeVariant.price
    }
  }

  if (product.is_wholesale_enabled && product.wholesale_price && product.wholesale_min_qty) {
    if (quantity >= product.wholesale_min_qty) {
      return product.wholesale_price
    }
  }

  return product.is_retail_enabled ? (product.retail_price ?? 0) : (product.wholesale_price ?? 0)
}

/**
 * Helper to determine if volume wholesale conditions are active for the current step.
 */
export function isWholesaleActive(
  product: Product,
  quantity: number,
  selectedVariant: ProductVariant | null = null
): boolean {
  if (!product.is_wholesale_enabled) return false

  if (product.is_variants_enabled && selectedVariant) {
    const targetMin = selectedVariant.wholesale_min_qty ?? product.wholesale_min_qty
    const targetPrice = selectedVariant.wholesale_price ?? product.wholesale_price
    return !!(targetMin && targetPrice && quantity >= targetMin)
  }

  return !!(product.wholesale_price && product.wholesale_min_qty && quantity >= product.wholesale_min_qty)
}