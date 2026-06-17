// src/components/product/AddToCartButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import QuantitySelector from '@/components/product/QuantitySelector'
import { ClientOnly } from '@/components/ui/ClientOnly'
import { formatCurrency } from '@/lib/utils'
import { parseVariants, getEffectivePrice } from '@/lib/pricing'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    slug: string
    retail_price: number
    wholesale_price: number | null
    wholesale_min_qty: number | null
    mrp?: number | null
    stock: number
    images: string[]
    category_id?: string | null
    description?: string | null
    rating?: number | null
    review_count?: number | null
    variant_name?: string   // optional
    variant_string?: string | null
    variants?: any
    is_retail_enabled: boolean
    is_wholesale_enabled: boolean
    is_variants_enabled: boolean
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
  
  const activeVariantName = product.variant_name || product.variant_string || null
  const parsedVariants = parseVariants(product.variants)
  const selectedVariant = parsedVariants.find(v => v.name === activeVariantName) || null
  
  const effectiveUnitPrice = getEffectivePrice(product as any, finalQuantity, selectedVariant)
  const totalPrice = effectiveUnitPrice * finalQuantity

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }

    setIsAdding(true)
    try {
      if (editItemId) {
        // Strip out brackets if editing to recalculate state cleanly
        const rawProductName = product.name.split(' (')[0]
        await updateItem(editItemId, {
          name: activeVariantName ? `${rawProductName} (${activeVariantName})` : rawProductName,
          quantity: finalQuantity,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          wholesale_min_qty: product.wholesale_min_qty,
          variants: product.variants,
          is_retail_enabled: product.is_retail_enabled,
          is_wholesale_enabled: product.is_wholesale_enabled,
          is_variants_enabled: product.is_variants_enabled,
          variant_string: activeVariantName,
        })
        showToast('Shopping Bag updated', 'success')
        router.push('/cart')
      } else {
        // ⚡ FIXED: Dynamic Name Assembly ensures structural brackets render instantly
        const computedName = activeVariantName ? `${product.name} (${activeVariantName})` : product.name

        await addItem({
          product_id: product.id,
          name: computedName,
          slug: product.slug,
          quantity: finalQuantity,
          image: product.images?.[0] || '',
          stock: product.stock,
          category_id: product.category_id || null,
          description: product.description || null,
          is_retail_enabled: product.is_retail_enabled,
          is_wholesale_enabled: product.is_wholesale_enabled,
          is_variants_enabled: product.is_variants_enabled,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          wholesale_min_qty: product.wholesale_min_qty,
          rating: product.rating || null,
          review_count: product.review_count || null,
          mrp: product.mrp || product.retail_price,
          variant_string: activeVariantName,
          variants: product.variants, 
          bundle_title: null,
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
  const defaultClasses = "w-full h-12 text-[12px] font-bold normal tracking-widest bg-stone-100 hover:bg-stone-200 text-gray-900 rounded-full cursor-pointer transition-all duration-300 shadow-sm active:scale-[0.99] border-none outline-none flex items-center justify-center"
  const buttonClasses = className || defaultClasses

  let buttonText = 'Add to Cart'
  if (editItemId) buttonText = 'Save Changes'
  else if (isOutOfStock) buttonText = 'Sold Out'
  else if (showPriceInButton) buttonText = `Add to Cart – ${formatCurrency(totalPrice)}`
  else buttonText = 'Add to Cart'

  const minQuantityGate = (!product.is_retail_enabled && product.is_wholesale_enabled)
    ? (product.wholesale_min_qty || 1)
    : 1

  return (
    <div className={`w-full flex flex-col gap-3.5 ${showQuantitySelector ? 'mt-2' : ''}`} onClick={(e) => e.stopPropagation()}>
      {showQuantitySelector && !isOutOfStock && (
        <ClientOnly fallback={
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-gray-400 capitalize tracking-wider">Quantity</span>
            <div className="w-24 h-8 bg-stone-50 animate-pulse rounded-full" />
          </div>
        }>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold text-gray-700 capitalize tracking-wider">Quantity</span>
            <QuantitySelector
              quantity={localQuantity < minQuantityGate ? minQuantityGate : localQuantity}
              onQuantityChange={setLocalQuantity}
              min={minQuantityGate}
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
          className={`${buttonClasses} cursor-pointer disabled:opacity-40 disabled:border-transparent disabled:cursor-not-allowed`}
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
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