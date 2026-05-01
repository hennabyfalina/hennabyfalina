// src/components/product/AddToCartButton.tsx

'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import BuyNowButton from '@/components/product/BuyNowButton'
import QuantitySelector from '@/components/product/QuantitySelector'
import { B2B_CONSTANTS } from '@/config/b2b-rules' 

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
    rating?: number | null
    review_count?: number | null
  }
  quantity?: number
  minQuantity?: number 
  printingType?: string 
  // 🚨 UPGRADED TO ARRAY 🚨
  artworkUrls?: string[] 
  printingInstructions?: string | null 
  isAgreementChecked?: boolean 
  showQuantitySelector?: boolean
  className?: string
  onQuantityChange?: (qty: number) => void
}

export default function AddToCartButton({
  product,
  quantity: initialQuantity = 1,
  minQuantity = 1,
  printingType = 'None',
  // 🚨 UPGRADED TO ARRAY DEFAULT 🚨
  artworkUrls = [],
  printingInstructions = null,
  isAgreementChecked = true,
  showQuantitySelector = false,
  className = '',
  onQuantityChange
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(Math.max(initialQuantity, minQuantity))
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    setQuantity(minQuantity)
    if (onQuantityChange) onQuantityChange(minQuantity)
  }, [printingType, minQuantity, onQuantityChange])

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    if (onQuantityChange) onQuantityChange(newQuantity)
  }

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const isCustomPrint = printingType.includes('Single Color') || printingType.includes('Multi Color');
    
    if (isCustomPrint && !isAgreementChecked) {
      showToast('Please complete the details.', product.id);
      return;
    }

    // 🚨 UPGRADED VALIDATION TO CHECK ARRAY LENGTH 🚨
    if (printingType.includes('Multi Color') && (!artworkUrls || artworkUrls.length === 0)) {
      showToast('Please upload your Logo/Artwork for Multi-Color printing.', product.id);
      return;
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
    const finalPrice = product.bulk_price && (quantity >= (product.bulk_min_quantity || B2B_CONSTANTS.WHOLESALE_MIN_QTY)) ? product.bulk_price : sellingPrice;

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
          rating: product.rating || null,
          review_count: product.review_count || null,
          selling_price: sellingPrice,
          printing_type: printingType,
          // 🚨 UPGRADED TO ARRAY 🚨
          artwork_urls: artworkUrls,
          printing_instructions: printingInstructions,
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
  const buttonClasses = className || "w-full h-11 text-[15px] bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full shadow-sm font-medium"

  return (
    <div className={`w-full flex flex-col gap-3 ${showQuantitySelector ? 'mt-2' : ''}`} onClick={(e) => e.stopPropagation()}>
      {showQuantitySelector && !isOutOfStock && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Quantity:</span>
          <QuantitySelector 
            quantity={quantity} 
            onQuantityChange={handleQuantityChange} 
            min={minQuantity} 
            max={product.stock > 0 ? product.stock : 99999} 
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${buttonClasses}`}
        >
          {isAdding ? (
            <><div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" /><span>Adding...</span></>
          ) : (
            <span>{isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}</span>
          )}
        </button>
        {!isOutOfStock && showQuantitySelector && (
          
          //* 🚨 UPGRADED PROP DRILLING 🚨
          <BuyNowButton product={product as any} quantity={quantity} printingType={printingType} artworkUrls={artworkUrls} printingInstructions={printingInstructions} />
        )}
      </div>
    </div>
  )
}