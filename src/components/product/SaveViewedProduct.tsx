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
  stock?: number
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

      // Ensure stock is explicitly saved
      const productToSave = { ...product, stock: product.stock ?? 0 }

      // Add new product to the beginning of the array
      recent.unshift(productToSave)

      // Keep only the last 8 viewed products to give a nice scrollable shelf
      recent = recent.slice(0, 8)

      // Save back to localStorage
      localStorage.setItem('razack_recently_viewed', JSON.stringify(recent))
    } catch (error) {
      console.error('Error saving recently viewed product:', error)
    }
  }, [product])

  // This component doesn't render anything, it's just a data tracker
  return null
}