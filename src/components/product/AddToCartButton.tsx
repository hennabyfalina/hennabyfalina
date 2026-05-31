// src/components/product/AddToCartButton.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuickViewStore } from '@/store/quickview.store'
import { useCartStore } from '@/store/cart.store'
import { useProductDraftStore } from '@/store/productDraft.store'
import { showToast } from '@/components/ui/Toast'
import QuantitySelector from '@/components/product/QuantitySelector'
import { deleteB2BArtwork } from '@/lib/supabase/b2b-storage'
import { ClientOnly } from '@/components/ui/ClientOnly'
import EditCartConfirmModal from './EditCartConfirmModal'
import EditConflictModal from './EditConflictModal'
import ItemMissingModal from './ItemMissingModal'
import { broadcast } from '@/lib/broadcast'

// 🚀 Simple, reliable scroll using native browser behaviour
const scrollToOptions = (elementId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const tryScroll = () => {
      const element = document.getElementById(elementId)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        resolve(true)
      } else {
        resolve(false)
      }
    }

    // Try immediately
    if (document.getElementById(elementId)) {
      tryScroll()
      return
    }

    // Wait for element to appear (e.g., after navigation)
    const observer = new MutationObserver(() => {
      if (document.getElementById(elementId)) {
        observer.disconnect()
        tryScroll()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => {
      observer.disconnect()
      resolve(false)
    }, 1000)
  })
}

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    selling_price?: number
    stock: number
    images: string[]
    category_id?: string | null
    description?: string | null
    rating?: number | null
    review_count?: number | null
    pricing_tiers?: any[]
  }
  quantity?: number
  minQuantity?: number
  printingType?: string
  artworkUrls?: string[] | null
  artworkSizes?: number[] | null
  printingInstructions?: string | null
  isArtworkRightsChecked?: boolean
  isPrintTimelineChecked?: boolean
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
  isArtworkRightsChecked = false,
  isPrintTimelineChecked = false,
  showQuantitySelector = false,
  className = '',
  onQuantityChange,
  requireCustomizationChoice = false,
  editItemId = null
}: AddToCartButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentProductSlug = product.slug
  const closeQuickView = useQuickViewStore((state) => state.closeQuickView)
  const draft = useProductDraftStore((state) => state.drafts[product.id])
  const clearDraft = useProductDraftStore((state) => state.clearDraft)

  const effectivePrintingType = propPrintingType ?? draft?.printingType ?? 'Retail (Readymade)'
  const effectiveArtworkUrls = propArtworkUrls !== undefined && propArtworkUrls !== null ? propArtworkUrls : (draft?.artworkUrls ?? [])
  const effectiveArtworkSizes = propArtworkSizes !== undefined && propArtworkSizes !== null ? propArtworkSizes : (draft?.artworkSizes ?? [])
  const effectivePrintingInstructions = propPrintingInstructions !== null ? propPrintingInstructions : (draft?.instructions ?? null)
  const effectiveIsArtworkRightsChecked = (draft as any)?.isArtworkRightsChecked ?? isArtworkRightsChecked
  const effectiveIsPrintTimelineChecked = (draft as any)?.isPrintTimelineChecked ?? isPrintTimelineChecked
  
  // 🚨 PHASE 7: Dynamic Tier Resolution
  const selectedTier = product.pricing_tiers?.find(t => t.tier_name === effectivePrintingType)
  const isCustomPrint = selectedTier?.requires_artwork ?? false
  const effectiveMinQuantity = minQuantity !== 1 ? minQuantity : (selectedTier?.min_quantity ?? 1)

  const existingItem = useCartStore((state) =>
    editItemId ? state.items.find(i => i.id === editItemId) : state.findCartItem(product.id, effectivePrintingType)
  )

  const finalArtworkUrls = isCustomPrint ? effectiveArtworkUrls : []
  const finalArtworkSizes = isCustomPrint ? effectiveArtworkSizes : []
  const finalPrintingInstructions = isCustomPrint ? effectivePrintingInstructions : null

  const orphanedFiles = existingItem?.artwork_urls?.filter(url => !finalArtworkUrls.includes(url)) || []

  const [quantity, setQuantity] = useState(Math.max(initialQuantity, effectiveMinQuantity))
  const [isAdding, setIsAdding] = useState(false)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [isItemMissing, setIsItemMissing] = useState(false)
  const [showMissingModal, setShowMissingModal] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const updateItem = useCartStore((state) => state.updateItem)
  const removeItem = useCartStore((state) => state.removeItem)

  const sellingPrice = selectedTier?.selling_price ?? (product.selling_price ?? product.price ?? 0)
  const finalPrice = sellingPrice 
  
  const newTotal = finalPrice * quantity
  const oldTotal = existingItem ? existingItem.price * existingItem.quantity : 0

  // Calculate Old and New Delivery Days for the Modal
  const oldTier = product.pricing_tiers?.find(t => t.tier_name === existingItem?.printing_type)
  const oldDays = oldTier?.delivery_days ?? 7
  const newDays = selectedTier?.delivery_days ?? 7

  const prevMinQuantityRef = useRef(effectiveMinQuantity)

  // 🚨 PHASE 3: Check for version conflicts when in edit mode
  const initialVersionRef = useRef<number | null>(null)

  useEffect(() => {
    if (!editItemId || !existingItem) return

    // Capture the version once when the component mounts or when editItemId changes
    if (initialVersionRef.current === null) {
      initialVersionRef.current = existingItem.version || 1
    }

    const loadedVersion = initialVersionRef.current

    const handleItemUpdated = (data: any) => {
      if (data.productId === product.id) {
        // Small delay to ensure store update
        setTimeout(() => {
          const currentItem = useCartStore.getState().items.find(i => i.id === editItemId)
          if (currentItem && (currentItem.version || 1) !== loadedVersion) {
            setShowConflictModal(true)
            showToast('This item was modified in another tab. Please review your changes.', 'warning')
          } else if (!currentItem) {
            // Item was deleted – show missing modal
            setShowMissingModal(true)
          }
        }, 100)
      }
    }

    const unsubscribe = broadcast.on('CART_ITEM_UPDATED', handleItemUpdated)
    return () => unsubscribe()
  }, [editItemId, existingItem, product.id])

  useEffect(() => {
    if (!editItemId || !initialVersionRef.current) return

    const interval = setInterval(() => {
      const currentItem = useCartStore.getState().items.find(i => i.id === editItemId)
      if (currentItem && (currentItem.version || 1) !== initialVersionRef.current) {
        setShowConflictModal(true)
        clearInterval(interval)
      } else if (!currentItem) {
        setShowMissingModal(true)
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [editItemId])

  useEffect(() => {
    if (effectiveMinQuantity !== prevMinQuantityRef.current) {
      setQuantity(effectiveMinQuantity)
      prevMinQuantityRef.current = effectiveMinQuantity
    } else if (quantity < effectiveMinQuantity) {
      setQuantity(effectiveMinQuantity)
    }
  }, [effectiveMinQuantity, quantity])

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    if (onQuantityChange) onQuantityChange(newQuantity)
  }

  const validateCustomPrint = (): { valid: boolean; message?: string } => {
    if (!isCustomPrint) return { valid: true }
    if (!effectiveArtworkUrls || effectiveArtworkUrls.length === 0) return { valid: false, message: `Please upload your artwork for this option.` }
    if (!effectiveIsArtworkRightsChecked) return { valid: false, message: 'Please confirm you have legal rights to the uploaded artwork.' }
    if (!effectiveIsPrintTimelineChecked) return { valid: false, message: 'Please acknowledge the custom printing timeline.' }
    return { valid: true }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleOverwrite = async () => {
    setShowConflictModal(false)
    await executeAddToCart(true) // force overwrite
  }

  const executeAddToCart = async (forceOverwrite = false) => {
    setIsAdding(true)
    try {
      // Check version conflict again right before save
      if (editItemId && !forceOverwrite) {
        const currentItem = useCartStore.getState().items.find(i => i.id === editItemId)
        const loadedVersion = existingItem?.version || 1
        if (currentItem && (currentItem.version || 1) !== loadedVersion) {
          setShowConflictModal(true)
          setShowEditConfirm(false)
          setIsAdding(false)
          return
        }
      }

      if (orphanedFiles.length > 0) {
        Promise.all(orphanedFiles.map(path => deleteB2BArtwork(path).catch(console.error)))
        broadcast.send({
          type: 'ARTWORK_DELETED',
          paths: orphanedFiles
        })
      }

      if (editItemId) {
  // Update existing item instead of removing + adding
  await updateItem(editItemId, {
    quantity,
    printing_type: effectivePrintingType,
    artwork_urls: finalArtworkUrls,
    artwork_sizes: finalArtworkSizes,
    printing_instructions: finalPrintingInstructions,
    price: finalPrice,
    selling_price: sellingPrice,
    pricing_tiers: product.pricing_tiers || [],
  })
  
} else {
  await addItem({
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
    rating: product.rating || null,
    review_count: product.review_count || null,
    selling_price: sellingPrice,
    printing_type: effectivePrintingType,
    artwork_urls: finalArtworkUrls,
    artwork_sizes: finalArtworkSizes,
    printing_instructions: finalPrintingInstructions,
    pricing_tiers: product.pricing_tiers || []
  })
}

      broadcast.send({
        type: 'CART_ITEM_UPDATED',
        productId: product.id,
        printingType: effectivePrintingType
      })

      // 🚨 PHASE 7: Ghost File Bug Fix
      if (editItemId || orphanedFiles.length > 0) {
        clearDraft(product.id)
      }

      if (editItemId) {
        showToast('Cart updated', 'success')
        router.push('/cart')
      } else {
        showToast('Added to Cart', 'success')
      }
    } catch (err: any) {
      showToast('Failed to update cart', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }

    if (requireCustomizationChoice) {
      closeQuickView()

      // Check if we are already on the same product page
      const isOnProductPage = pathname === `/product/${encodeURIComponent(currentProductSlug)}`

      if (isOnProductPage) {
        // Use the custom smooth scroll function
        await scrollToOptions('b2b-options')
      } else {
        // Preserve existing query params (including edit_item) and add customize=true
        const currentParams = new URLSearchParams(window.location.search)
        currentParams.set('customize', 'true')
        const queryString = currentParams.toString()
        router.push(`/product/${encodeURIComponent(currentProductSlug)}${queryString ? `?${queryString}` : ''}#b2b-options`)
      }
      return
    }

    const validation = validateCustomPrint()
    if (!validation.valid) {
      showToast(validation.message!, 'error')
      return
    }

    // Check for version conflict before showing edit confirm modal
    if (editItemId && existingItem) {
      const currentItem = useCartStore.getState().items.find(i => i.id === editItemId)
      const loadedVersion = existingItem.version || 1
      if (currentItem && (currentItem.version || 1) !== loadedVersion) {
        setShowConflictModal(true)
        return
      }
      setShowEditConfirm(true)
      return
    }

    await executeAddToCart(false)
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
          className={`flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 cursor-pointer ${buttonClasses}`}
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
          ) : requireCustomizationChoice ? (
            <span>View Options</span>
          ) : (
            <ClientOnly fallback={<span>Add to Cart</span>}>
              {editItemId ? <span>Save Changes</span> : <span>{isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}</span>}
            </ClientOnly>
          )}
        </button>
      </div>

      {existingItem && editItemId && (
        <EditCartConfirmModal
          isOpen={showEditConfirm}
          onClose={() => setShowEditConfirm(false)}
          onConfirm={() => executeAddToCart(false)}
          isLoading={isAdding}
          oldQty={existingItem.quantity}
          newQty={quantity}
          oldPrint={existingItem.printing_type || 'Retail (Readymade)'}
          newPrint={effectivePrintingType}
          oldTotal={oldTotal}
          newTotal={newTotal}
          oldDays={oldDays}
          newDays={newDays} 
          filesWillBeDeleted={orphanedFiles.length > 0}
          productName={product.name}
        />
      )}

      <EditConflictModal
        isOpen={showConflictModal}
        onReload={handleReload}
        onOverwrite={handleOverwrite}
        isLoading={isAdding}
      />

      {showMissingModal && <ItemMissingModal onReload={() => window.location.reload()} />}
    </div>
  )
}