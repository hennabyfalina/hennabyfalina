'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  selling_price?: number | null
  bulk_price?: number | null
  bulk_min_quantity?: number | null
  images: string[]
  stock: number
  category_id?: string | null
  description?: string | null
  rating?: number | null
  review_count?: number | null
}

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product
  bundleProducts: Product[]
}

export default function FrequentlyBoughtTogether({ mainProduct, bundleProducts }: FrequentlyBoughtTogetherProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const allProducts = [mainProduct, ...bundleProducts]

  useEffect(() => {
    // By default, select all products that are currently in stock
    setSelectedIds(allProducts.filter(p => p.stock > 0).map(p => p.id))
  }, [mainProduct, bundleProducts])

  // If there are no bundle items assigned to this product, don't render the section
  if (!bundleProducts || bundleProducts.length === 0) return null

  const selectedProducts = allProducts.filter(p => selectedIds.includes(p.id))
  
  const totalPrice = selectedProducts.reduce((sum, p) => {
    const sellingPrice = p.selling_price ?? p.price ?? 0
    return sum + sellingPrice
  }, 0)

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleAddAllToCart = async () => {
    if (selectedProducts.length === 0) return
    
    setIsAdding(true)
    try {
      // Add all selected products to cart simultaneously 
      await Promise.all(selectedProducts.map(async (product) => {
        const sellingPrice = product.selling_price ?? product.price ?? 0
        const finalPrice = product.bulk_price && product.bulk_price < sellingPrice ? product.bulk_price : sellingPrice

        await addItem({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: finalPrice,
          quantity: 1,
          image: product.images?.[0] || '',
          stock: product.stock,
          category_id: product.category_id || null,
          description: product.description || null,
          original_price: product.price,
          bulk_price: product.bulk_price || null,
          bulk_min_quantity: product.bulk_min_quantity || null,
          rating: product.rating || null,
          review_count: product.review_count || null,
          selling_price: sellingPrice,
        })
      }))
      showToast(`Added ${selectedProducts.length} items to Cart`, 'success')
    } catch (error) {
      showToast('Failed to add some items to cart', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-sm p-4 md:p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#0F1111] mb-4">Frequently bought together</h2>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Images Row */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {allProducts.map((p, i) => {
            const isSelected = selectedIds.includes(p.id)
            const rawImage = p.images?.[0]
            const imageUrl = !rawImage ? '/placeholder-product.svg' : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

            return (
              <div key={p.id} className="flex items-center gap-3 shrink-0">
                <Link href={`/product/${p.slug}`}>
                  <div className={`relative w-[120px] h-[120px] bg-[#F8F8F8] rounded-sm p-2 transition-all ${isSelected ? 'opacity-100 border border-gray-300 shadow-sm' : 'opacity-50 border border-transparent'}`}>
                    <Image
                      src={imageUrl}
                      alt={p.name}
                      fill
                      sizes="120px"
                      className="object-contain mix-blend-multiply"
                      unoptimized={imageUrl.startsWith('http') || imageUrl.includes('supabase')}
                    />
                  </div>
                </Link>
                {i < allProducts.length - 1 && (
                  <Plus className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Add to cart & Price */}
        <div className="flex flex-col justify-center min-w-[200px] shrink-0">
          <div className="mb-3">
            <span className="text-sm text-[#0F1111]">Total price: </span>
            <span className="text-lg font-bold text-[#B12704]">{formatCurrency(totalPrice)}</span>
          </div>
          <button
            onClick={handleAddAllToCart}
            disabled={isAdding || selectedProducts.length === 0}
            className="w-full sm:w-auto px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-medium rounded-full shadow-sm border border-[#FCD200] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-[#0F1111] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            <span>Add {selectedProducts.length > 1 ? 'all ' : ''}to Cart</span>
          </button>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="mt-6 flex flex-col gap-2">
        {allProducts.map((p) => {
          const isSelected = selectedIds.includes(p.id)
          const sellingPrice = p.selling_price ?? p.price ?? 0
          const isMain = p.id === mainProduct.id
          const isOutOfStock = p.stock <= 0

          return (
            <label key={p.id} className={`flex items-start gap-3 ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isOutOfStock}
                onChange={() => handleToggle(p.id)}
                className="mt-1 w-4 h-4 text-[#007185] border-gray-300 rounded-sm focus:ring-[#007185]"
              />
              <div className="flex-1 text-sm leading-tight">
                <Link href={`/product/${p.slug}`} className="text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
                  {isMain && <span className="font-bold text-[#0F1111]">This item: </span>}
                  {p.name}
                </Link>
                <span className="font-bold text-[#B12704] ml-2">{formatCurrency(sellingPrice)}</span>
                {isOutOfStock && <span className="text-[#B12704] ml-2 font-medium">(Out of Stock)</span>}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
