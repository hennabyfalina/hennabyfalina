'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    selling_price?: number
    bulk_price?: number | null
    stock: number
    images: string[]
    category_id?: string | null
    description?: string | null
    bulk_min_quantity?: number | null
  }
  quantity?: number
  showQuantitySelector?: boolean
  className?: string
}

export default function AddToCartButton({
  product,
  quantity: initialQuantity = 1,
  showQuantitySelector = false,
  className = '',
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (product.stock <= 0) {
      showToast('Out of stock', product.id)
      return
    }

    if (quantity > product.stock) {
      showToast(`Only ${product.stock} items available`, product.id)
      return
    }

    setIsAdding(true)

    const sellingPrice = product.selling_price ?? product.price ?? 0;
    const finalPrice = product.bulk_price && product.bulk_price < sellingPrice ? product.bulk_price : sellingPrice;

    try {
      await Promise.all([
        addItem({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: finalPrice,
          quantity: quantity,
          image: product.images?.[0] || '',
          stock: product.stock,
          category_id: product.category_id || null,
          description: product.description || null,
          original_price: product.price,
          bulk_price: product.bulk_price || null,
          bulk_min_quantity: product.bulk_min_quantity || null,
          selling_price: sellingPrice,
        }),
        new Promise((resolve) => setTimeout(resolve, 400))
      ])
      
      showToast('Added to Cart', product.id)

    } catch (err: any) {
      showToast('Failed to add to cart', product.id)
    } finally {
      setIsAdding(false)
    }
  }

  const isOutOfStock = product.stock <= 0
  const buttonClasses = className || "w-full h-9 text-sm bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full shadow-sm"

  return (
    <div className={`w-full ${showQuantitySelector ? 'space-y-3' : ''}`} onClick={(e) => e.stopPropagation()}>
      {showQuantitySelector && !isOutOfStock && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-[#0F1111] bg-gray-100 border border-gray-300 rounded-sm px-2 py-1 shadow-sm flex items-center gap-2">
            Qty:
            <select
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              className="bg-transparent outline-none focus:ring-0 font-medium cursor-pointer"
            >
              {Array.from({ length: Math.min(product.stock, 30) }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`flex items-center justify-center gap-2 font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${buttonClasses}`}
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
          )}
        </button>
        
        {/* Buy Now Button */}
        {!isOutOfStock && showQuantitySelector && (
          <button
            type="button"
            onClick={(e) => {
              handleAddToCart(e).then(() => {
                window.location.href = '/checkout';
              })
            }}
            disabled={isAdding || isOutOfStock}
            className={`flex items-center justify-center gap-2 font-medium transition-all duration-300 active:scale-[0.98] w-full h-9 text-sm bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full shadow-sm`}
          >
             Buy Now
          </button>
        )}
      </div>
    </div>
  )
}