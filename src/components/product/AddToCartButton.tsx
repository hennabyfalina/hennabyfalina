// src/components/product/AddToCartButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import QuantitySelector from '@/components/product/QuantitySelector'
import { ClientOnly } from '@/components/ui/ClientOnly'
import { formatCurrency } from '@/lib/utils'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    slug: string
    retail_price: number
    wholesale_price: number
    wholesale_min_qty: number
    mrp?: number
    stock: number
    images: string[]
    category_id?: string | null
    description?: string | null
    rating?: number | null
    review_count?: number | null
    variant_name?: string   // optional
  }
  quantity?: number
  showQuantitySelector?: boolean
  className?: string
  editItemId?: string | null
  showPriceInButton?: boolean
}

export default function AddToCartButton({
  product,
  quantity = 1,
  showQuantitySelector = false,
  className = '',
  editItemId = null,
  showPriceInButton = false,
}: AddToCartButtonProps) {
  const router = useRouter()
  
  const [localQuantity, setLocalQuantity] = useState(quantity)
  const [isAdding, setIsAdding] = useState(false)
  
  const addItem = useCartStore((state) => state.addItem)
  const updateItem = useCartStore((state) => state.updateItem)

  const finalQuantity = showQuantitySelector ? localQuantity : quantity
  const totalPrice = product.retail_price * finalQuantity

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }

    setIsAdding(true)
    try {
      if (editItemId) {
        await updateItem(editItemId, {
          quantity: finalQuantity,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          wholesale_min_qty: product.wholesale_min_qty,
        })
        showToast('Shopping Bag updated', 'success')
        router.push('/cart')
      } else {
        await addItem({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          quantity: finalQuantity,
          image: product.images?.[0] || '',
          stock: product.stock,
          category_id: product.category_id || null,
          description: product.description || null,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          wholesale_min_qty: product.wholesale_min_qty,
          rating: product.rating || null,
          review_count: product.review_count || null,
          mrp: product.mrp || 0,
          variant_string: product.variant_name || null,
          bundle_title: null, // Can be extended if bundle logic is added
        })
        showToast('Added to Shopping Bag', 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update bag', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const isOutOfStock = (product.stock ?? 0) <= 0
  const defaultClasses = "w-full h-12 text-[12px] font-bold capitalise tracking-widest bg-stone-100 hover:bg-stone-200 text-gray-900 rounded-full cursor-pointer transition-all duration-300 shadow-sm active:scale-[0.99]"
  const buttonClasses = className || defaultClasses

  let buttonText = 'Add to Cart'
  if (editItemId) buttonText = 'Save Changes'
  else if (isOutOfStock) buttonText = 'Sold Out'
  else if (showPriceInButton) buttonText = `Add to Cart – ${formatCurrency(totalPrice)}`
  else buttonText = 'Add to Cart'

  return (
    <div className={`w-full flex flex-col gap-3.5 ${showQuantitySelector ? 'mt-2' : ''}`} onClick={(e) => e.stopPropagation()}>
      {showQuantitySelector && !isOutOfStock && (
        <ClientOnly fallback={
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-gray-400 capitalise tracking-wider">Quantity</span>
            <div className="w-24 h-8 bg-stone-50 animate-pulse rounded-full" />
          </div>
        }>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-gray-700 capitalise tracking-wider">Quantity</span>
            <QuantitySelector
              quantity={localQuantity}
              onQuantityChange={setLocalQuantity}
              min={1}
              max={product.stock > 0 ? product.stock : 99999}
            />
          </div>
        </ClientOnly>
      )}
      
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`${buttonClasses} cursor-pointer disabled:opacity-40 disabled:bg-stone-100 disabled:border-transparent disabled:text-gray-400 disabled:cursor-not-allowed`}
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin cursor-pointer" />
          ) : (
            <ClientOnly fallback={<span>Add to Cart</span>}>
              <span>{buttonText}</span>
            </ClientOnly>
          )}
        </button>
      </div>
    </div>
  )
}