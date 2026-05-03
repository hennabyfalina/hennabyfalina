// src/components/product/SaveViewedProduct.tsx

'use client'

import { useEffect } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image: string
  images?: string[]
  original_price?: number
  selling_price?: number
  bulk_price?: number | null
  bulk_min_quantity?: number | null
  description?: string | null
  stock?: number  // ✅ Make sure this is included
  rating?: number | null
  review_count?: number | null
}

interface SaveViewedProductProps {
  product: Product
}

export default function SaveViewedProduct({ product }: SaveViewedProductProps) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('razack_recently_viewed')
      let recent: Product[] = stored ? JSON.parse(stored) : []

      // Remove duplicate if product already exists
      recent = recent.filter((p: Product) => p.id !== product.id)

      // ✅ Ensure stock is explicitly saved with a fallback
      const productToSave = { 
        ...product, 
        stock: product.stock ?? 0  // Make sure stock is saved (0 if undefined)
      }

      // Add new product to the beginning of the array
      recent.unshift(productToSave)

      // Keep only the last 8 viewed products
      recent = recent.slice(0, 8)

      // Save back to localStorage
      localStorage.setItem('razack_recently_viewed', JSON.stringify(recent))
      
      // Debug: log to verify stock is saved
      console.log('[SaveViewedProduct] Saved product:', productToSave.id, 'stock:', productToSave.stock)
    } catch (error) {
      console.error('Error saving recently viewed product:', error)
    }
  }, [product])

  return null
}