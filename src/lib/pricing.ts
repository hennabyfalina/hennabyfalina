// src/lib/pricing.ts

import type { Product } from '@/types/database.types'

export interface ProductVariant {
  name: string
  price: number
  variant_mrp?: number
  wholesale_price?: number
  wholesale_min_qty?: number
}

/**
 * Safely parses the flexible product variants field from Supabase into a true typed array.
 */
export function parseVariants(variants: any): ProductVariant[] {
  if (!variants) return []
  if (typeof variants === 'string') {
    try {
      return JSON.parse(variants) as ProductVariant[]
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
 * Gets the price for a specific variant by name.
 * Returns the variant price if found, otherwise the base retail price.
 */
export function getVariantPrice(product: Product, variantName: string | null): number {
  if (!variantName) return product.retail_price ?? 0
  
  const variants = parseVariants(product.variants)
  const found = variants.find(v => v.name === variantName)
  return found ? found.price : (product.retail_price ?? 0)
}

/**
 * Enriches product with selected variant info for cart/checkout.
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
 * Big-Tech Optimization: Computes all display pricing metrics for any product row in a single pass.
 */
export function getComputedProductPrices(product: Product, selectedVariant: ProductVariant | null) {
  const parsedVariants = parseVariants(product.variants)
  const hasVariants = parsedVariants.length > 0

  // Priority: Use selected variant if provided, otherwise find the cheapest for display
  const activeVariant = selectedVariant || (hasVariants
    ? parsedVariants.reduce((min, v) => v.price < min.price ? v : min, parsedVariants[0])
    : null)

  const displayPrice = activeVariant ? activeVariant.price : (product.retail_price ?? 0)
  
  // Use variant-specific MRP if available, otherwise fallback to product root MRP
  const activeMrp = (activeVariant?.variant_mrp) || product.mrp

  // Calculate true dynamic discount percentage against MRP
  const discountPct = activeMrp && activeMrp > displayPrice
    ? Math.round(((activeMrp - displayPrice) / activeMrp) * 100)
    : 0

  const isOutOfStock = (product.stock ?? 0) <= 0
  
  // Explicitly identify valid wholesale availability if the big-tech threshold rules are present
  const isWholesaleAvailable = product.wholesale_min_qty !== null && product.wholesale_min_qty > 1

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
 * Calculates the effective price based on quantity and wholesale thresholds.
 */
export function getEffectivePrice(
  product: Product,
  quantity: number,
  selectedVariant: ProductVariant | null = null
): number {
  if (selectedVariant) {
    if (selectedVariant.wholesale_price && selectedVariant.wholesale_min_qty && quantity >= selectedVariant.wholesale_min_qty) {
      return selectedVariant.wholesale_price;
    }
    return selectedVariant.price;
  }
  if (product.wholesale_price && product.wholesale_min_qty && quantity >= product.wholesale_min_qty) {
    return product.wholesale_price;
  }
  return product.retail_price ?? 0;
}

/**
 * Helper to determine if wholesale pricing is currently active for the given quantity.
 */
export function isWholesaleActive(
  product: Product,
  quantity: number,
  selectedVariant: ProductVariant | null = null
): boolean {
  if (selectedVariant) {
    return !!(selectedVariant.wholesale_price && selectedVariant.wholesale_min_qty && quantity >= selectedVariant.wholesale_min_qty);
  }
  return !!(product.wholesale_price && product.wholesale_min_qty && quantity >= product.wholesale_min_qty);
}