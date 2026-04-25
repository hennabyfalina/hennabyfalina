// src/components/product/SaveViewedProduct.tsx

'use client'

import { useEffect } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image: string
  original_price?: number
  selling_price?: number
  bulk_price?: number | null
  bulk_min_quantity?: number | null
  description?: string | null
}

interface SaveViewedProductProps {
  product: Product
}

export default function SaveViewedProduct({ product }: SaveViewedProductProps) {
  useEffect(() => {
    try {
      // Get existing recently viewed products from localStorage
      const stored = localStorage.getItem('razack_recently_viewed')
      let recent: Product[] = stored ? JSON.parse(stored) : []

      // Remove duplicate if product already exists
      recent = recent.filter((p: Product) => p.id !== product.id)

      // Add new product to the beginning of the array
      recent.unshift(product)

      // Keep only the last 5 viewed products
      recent = recent.slice(0, 5)

      // Save back to localStorage
      localStorage.setItem('razack_recently_viewed', JSON.stringify(recent))
    } catch (error) {
      console.error('Error saving recently viewed product:', error)
    }
  }, [product])

  // This component doesn't render anything
  return null
}