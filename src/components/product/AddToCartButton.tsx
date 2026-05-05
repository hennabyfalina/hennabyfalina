// src/components/product/AddToCartButton.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuickViewStore } from '@/store/quickview.store'
import { useCartStore } from '@/store/cart.store'
import { useProductDraftStore, type ProductDraft } from '@/store/productDraft.store'
import { showToast } from '@/components/ui/Toast'
import BuyNowButton from '@/components/product/BuyNowButton'
import QuantitySelector from '@/components/product/QuantitySelector'
import { B2B_CONSTANTS } from '@/config/b2b-rules'
import { deleteB2BArtwork } from '@/lib/supabase/b2b-storage'
import { ClientOnly } from '@/components/ui/ClientOnly'
import EditCartConfirmModal from './EditCartConfirmModal'

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
  artworkUrls?: string[] | null
  artworkSizes?: number[] | null
  printingInstructions?: string | null
  isAgreementChecked?: boolean
  showQuantitySelector?: boolean
  className?: string
  onQuantityChange?: (qty: number) => void
  requireCustomizationChoice?: boolean
  editItemId?: string | null
}

export default function AddToCartButton({
  product,
  quantity: initialQuantity = 1,
  minQuantity = 1,
  printingType: propPrintingType,
  artworkUrls: propArtworkUrls,
  artworkSizes: propArtworkSizes,
  printingInstructions: propPrintingInstructions = null,
  isAgreementChecked: propIsAgreementChecked = true,
  showQuantitySelector = false,
  className = '',
  onQuantityChange,
  requireCustomizationChoice = false,
  editItemId = null
}: AddToCartButtonProps) {
  const router = useRouter()
  const closeQuickView = useQuickViewStore((state) => state.closeQuickView)

  const draft = useProductDraftStore((state) => state.drafts[product.id])

  const effectivePrintingType = propPrintingType ?? draft?.printingType ?? 'Retail (Readymade)'
  const effectiveArtworkUrls = propArtworkUrls !== undefined && propArtworkUrls !== null ? propArtworkUrls : (draft?.artworkUrls ?? [])
  const effectiveArtworkSizes = propArtworkSizes !== undefined && propArtworkSizes !== null ? propArtworkSizes : (draft?.artworkSizes ?? [])
  const effectivePrintingInstructions = propPrintingInstructions !== null ? propPrintingInstructions : (draft?.instructions ?? null)
  const effectiveIsAgreementChecked = draft?.isAgreementChecked ?? propIsAgreementChecked
  const effectiveMinQuantity = minQuantity !== 1 ? minQuantity : (draft?.minQty ?? 1)

  const existingItem = useCartStore((state) =>
    editItemId ? state.items.find(i => i.id === editItemId) : state.findCartItem(product.id, effectivePrintingType)
  )

  // 🚨 SANITIZE INPUTS & DETECT GHOST FILES
  const isCustomPrint = effectivePrintingType.includes('Single Color') || effectivePrintingType.includes('Multi Color')
  const finalArtworkUrls = isCustomPrint ? effectiveArtworkUrls : []
  const finalArtworkSizes = isCustomPrint ? effectiveArtworkSizes : []
  const finalPrintingInstructions = isCustomPrint ? effectivePrintingInstructions : null

  const orphanedFiles = existingItem?.artwork_urls?.filter(url => !finalArtworkUrls.includes(url)) || []
  const filesWillBeDeleted = orphanedFiles.length > 0

  const [quantity, setQuantity] = useState(Math.max(initialQuantity, effectiveMinQuantity))
  const [isAdding, setIsAdding] = useState(false)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)

  // 🚨 Pre-calculate prices to feed to the Confirmation Modal
  const sellingPrice = product.selling_price ?? product.price ?? 0
  const finalPrice = product.bulk_price && (quantity >= (product.bulk_min_quantity || B2B_CONSTANTS.WHOLESALE_MIN_QTY))
    ? product.bulk_price
    : sellingPrice
  const newTotal = finalPrice * quantity
  const oldTotal = existingItem ? existingItem.price * existingItem.quantity : 0

  // Track if we've initialized from existing item in edit mode
  const [initializedFromEdit, setInitializedFromEdit] = useState(false)
  const prevMinQtyRef = useRef(effectiveMinQuantity)

  useEffect(() => {
    if (editItemId && existingItem && !initializedFromEdit) {
      const newQty = Math.max(existingItem.quantity, effectiveMinQuantity)
      setQuantity(newQty)
      if (onQuantityChange) onQuantityChange(newQty)
      setInitializedFromEdit(true)
      prevMinQtyRef.current = effectiveMinQuantity
    }
  }, [editItemId, existingItem, effectiveMinQuantity, initializedFromEdit, onQuantityChange])

  useEffect(() => {
    let newQty = quantity
    if (quantity < effectiveMinQuantity) {
      newQty = effectiveMinQuantity
    } else if (quantity === prevMinQtyRef.current && effectiveMinQuantity < prevMinQtyRef.current) {
      newQty = effectiveMinQuantity
    }
    if (newQty !== quantity) {
      setQuantity(newQty)
      if (onQuantityChange) onQuantityChange(newQty)
    }
    prevMinQtyRef.current = effectiveMinQuantity
  }, [effectiveMinQuantity, quantity, onQuantityChange])

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    if (onQuantityChange) onQuantityChange(newQuantity)
  }

  const validateCustomPrint = (): { valid: boolean; message?: string } => {
    const isCustomPrint = effectivePrintingType.includes('Single Color') || 
                          effectivePrintingType.includes('Multi Color')
    
    if (!isCustomPrint) {
      return { valid: true }
    }

    if (!effectiveIsAgreementChecked) {
      return { 
        valid: false, 
        message: 'Please agree to the custom printing terms & conditions.' 
      }
    }

    if (!effectiveArtworkUrls || effectiveArtworkUrls.length === 0) {
      return { 
        valid: false, 
        message: `Please upload your Logo/Artwork for ${effectivePrintingType} printing.` 
      }
    }

    return { valid: true }
  }

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }

    if (requireCustomizationChoice) {
      closeQuickView()
      router.push(`/product/${encodeURIComponent(product.slug)}?customize=true#b2b-options`)
      return
    }

    const validation = validateCustomPrint()
    if (!validation.valid) {
      showToast(validation.message!, product.id)
      return
    }

    const safeStock = product.stock ?? 99999

    if (safeStock <= 0) {
      showToast('Out of stock', product.id)
      return
    }

    if (quantity > safeStock) {
      showToast(`Only ${safeStock} items available`, product.id)
      return
    }

    // 🚀 INTERCEPT EDIT CLICKS TO SHOW THE SUMMARY MODAL
    if (editItemId && existingItem) {
      setShowEditConfirm(true)
      return
    }

    await executeAddToCart()
  }

  const executeAddToCart = async () => {
    setIsAdding(true)
    try {
      // 🚨 SCRUB THE GHOST FILES FROM THE SUPABASE BUCKET
      if (orphanedFiles.length > 0) {
        // Fire and forget asynchronous deletion
        Promise.all(orphanedFiles.map(path => deleteB2BArtwork(path).catch(console.error)))
      }

      // 🚀 If we are explicitly editing a line item, remove the old one before injecting the new config!
      if (editItemId) {
        await removeItem(editItemId)
      }

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
          printing_type: effectivePrintingType,
          artwork_urls: finalArtworkUrls,
          artwork_sizes: finalArtworkSizes,
          printing_instructions: finalPrintingInstructions,
        }),
        new Promise((resolve) => setTimeout(resolve, 400))
      ])

      if (editItemId) {
        showToast('Cart updated successfully', 'success')
        setShowEditConfirm(false)
        router.push('/cart')
      } else {
        showToast('Added to Cart', product.id)
      }
    } catch (err: any) {
      showToast('Failed to update cart', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const isOutOfStock = (product.stock ?? 99999) <= 0
  const buttonClasses = className || "w-full h-11 text-[15px] bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full shadow-sm font-medium"

  return (
    <div className={`w-full flex flex-col gap-3 ${showQuantitySelector ? 'mt-2' : ''}`} onClick={(e) => e.stopPropagation()}>
      {showQuantitySelector && !isOutOfStock && (
        <ClientOnly fallback={
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="w-24 h-8 bg-gray-100 animate-pulse rounded-full" />
          </div>
        }>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              min={effectiveMinQuantity}
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
          className={`flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${buttonClasses}`}
        >
          {isAdding ? (
            <><div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" /><span>{existingItem ? 'Updating...' : 'Adding...'}</span></>
          ) : requireCustomizationChoice ? (
            <span>View Options</span>
          ) : (
            // ✅ Wrap the conditional button text in ClientOnly to prevent hydration mismatch
            <ClientOnly fallback={<span>Add to Cart</span>}>
              {editItemId ? <span>Save Changes</span> : existingItem ? <span>Add More to Cart</span> : <span>{isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}</span>}
            </ClientOnly>
          )}
        </button>
        {!isOutOfStock && showQuantitySelector && (
          <BuyNowButton
            product={product}
            quantity={quantity}
            printingType={effectivePrintingType}
            artworkUrls={effectiveArtworkUrls}
            printingInstructions={effectivePrintingInstructions}
          />
        )}
      </div>

      {/* 🚨 THE NEW VISUAL CONFIRMATION MODAL 🚨 */}
      {existingItem && editItemId && (
        <EditCartConfirmModal
          isOpen={showEditConfirm}
          onClose={() => setShowEditConfirm(false)}
          onConfirm={executeAddToCart}
          isLoading={isAdding}
          oldQty={existingItem.quantity}
          newQty={quantity}
          oldPrint={existingItem.printing_type || 'Retail (Readymade)'}
          newPrint={effectivePrintingType}
          oldTotal={oldTotal}
          newTotal={newTotal}
          filesWillBeDeleted={filesWillBeDeleted}
          productName={product.name}
        />
      )}
    </div>
  )
}