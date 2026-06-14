// src/components/product/SaveViewedProduct.tsx

'use client'

import { useEffect } from 'react'

interface SaveViewedProductProps {
  product: any // full product from database
}

export default function SaveViewedProduct({ product }: SaveViewedProductProps) {
  useEffect(() => {
    if (!product?.id) return

    try {
      const storageKey = 'hennabyfalina_recently_viewed'
      const stored = localStorage.getItem(storageKey)
      let recent = stored ? JSON.parse(stored) : []

      // Remove duplicate if exists
      recent = recent.filter((p: any) => p.id !== product.id)

      // Store the COMPLETE product with ALL pricing fields
      const fullProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || null,
        images: product.images || [],
        stock: product.stock || 0,
        rating: product.rating ?? 4.5,
        review_count: product.review_count ?? 0,
        retail_price: product.retail_price || 0,
        wholesale_price: product.wholesale_price || 0,
        wholesale_min_qty: product.wholesale_min_qty || 1,
        mrp: product.mrp || null,           // ✅ CRITICAL
        variants: product.variants || null,  // ✅ CRITICAL
        category_id: product.category_id || null,
        is_active: product.is_active ?? true,
        is_deleted: product.is_deleted ?? false,
        is_featured: product.is_featured ?? false,
        sku: product.sku || null,
        weight: product.weight || null,
        weight_unit: product.weight_unit || null,
        gsm: product.gsm || null,
        dimensions: product.dimensions || null,
        meta_title: product.meta_title || null,
        meta_description: product.meta_description || null,
        frequently_bought_together: product.frequently_bought_together || null,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
      }

      // Add to beginning
      recent.unshift(fullProduct)

      // Keep only last 12 items
      recent = recent.slice(0, 12)

      localStorage.setItem(storageKey, JSON.stringify(recent))
      
      console.log('Saved to recently viewed:', fullProduct.name, 'MRP:', fullProduct.mrp)
    } catch (e) {
      console.error('Failed to save recently viewed product', e)
    }
  }, [product?.id])

  return null
}