// src/components/product/BuyNowButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { useQuickViewStore } from '@/store/quickview.store'
import { useProductDraftStore } from '@/store/productDraft.store'
import { showToast } from '@/components/ui/Toast'

interface BuyNowButtonProps {
  product: any
  quantity?: number
  printingType?: string
  artworkUrls?: string[] | null
  artworkSizes?: number[] | null
  printingInstructions?: string | null
  isArtworkRightsChecked?: boolean
  isPrintTimelineChecked?: boolean
  className?: string
  requireCustomizationChoice?: boolean
}

export default function BuyNowButton({
  product,
  quantity, 
  printingType: propPrintingType,
  artworkUrls: propArtworkUrls,
  artworkSizes: propArtworkSizes,
  printingInstructions: propPrintingInstructions = null,
  isArtworkRightsChecked = false,
  isPrintTimelineChecked = false,
  className = '',
  requireCustomizationChoice = false
}: BuyNowButtonProps) {
  const [isBuying, setIsBuying] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const closeQuickView = useQuickViewStore((state) => state.closeQuickView)
  const router = useRouter()
  const draft = useProductDraftStore((state) => state.drafts[product.id])
  const clearDraft = useProductDraftStore((state) => state.clearDraft)

  const effectivePrintingType = propPrintingType ?? draft?.printingType ?? 'Retail (Readymade)'
  const effectiveArtworkUrls = propArtworkUrls !== undefined && propArtworkUrls !== null ? propArtworkUrls : (draft?.artworkUrls ?? [])
  const effectiveArtworkSizes = propArtworkSizes !== undefined && propArtworkSizes !== null ? propArtworkSizes : (draft?.artworkSizes ?? [])
  const effectivePrintingInstructions = propPrintingInstructions !== null ? propPrintingInstructions : (draft?.instructions ?? null)
  const effectiveIsArtworkRightsChecked = (draft as any)?.isArtworkRightsChecked ?? isArtworkRightsChecked
  const effectiveIsPrintTimelineChecked = (draft as any)?.isPrintTimelineChecked ?? isPrintTimelineChecked

  // 🚨 PHASE 7: Dynamic Tier Lookup
  const selectedTier = product.pricing_tiers?.find((t: any) => t.tier_name === effectivePrintingType)
  const isCustomPrint = selectedTier?.requires_artwork ?? false
  
  // Ensure Buy Now forces the minimum quantity if the user hasn't specified one
  const finalQuantity = quantity ?? selectedTier?.min_quantity ?? 1

  const validateCustomPrint = (): { valid: boolean; message?: string } => {
    if (!isCustomPrint) return { valid: true }
    if (!effectiveArtworkUrls || effectiveArtworkUrls.length === 0) return { valid: false, message: 'Upload artwork for this choice.' }
    if (!effectiveIsArtworkRightsChecked) return { valid: false, message: 'Please confirm you have legal rights to the uploaded artwork.' }
    if (!effectiveIsPrintTimelineChecked) return { valid: false, message: 'Please acknowledge the custom printing timeline.' }
    return { valid: true }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (requireCustomizationChoice) {
      closeQuickView()
      router.push(`/product/${encodeURIComponent(product.slug)}?customize=true#b2b-options`)
      return
    }

    const validation = validateCustomPrint()
    if (!validation.valid) {
      showToast(validation.message!, 'error')
      return
    }

    if (!product || (product.stock ?? 0) <= 0) {
      showToast('Out of stock', 'error')
      return
    }

    setIsBuying(true)
    try {
      const finalPrice = selectedTier?.selling_price ?? (product.selling_price ?? product.price ?? 0)

      await addItem({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: finalPrice,
        quantity: finalQuantity, 
        image: product.images?.[0] || '',
        stock: product.stock,
        category_id: product.category_id || null,
        description: product.description || null,
        original_price: product.price,
        rating: product.rating || null,
        review_count: product.review_count || null,
        selling_price: product.selling_price || product.price,
        printing_type: effectivePrintingType,
        artwork_urls: isCustomPrint ? effectiveArtworkUrls : [],
        artwork_sizes: isCustomPrint ? effectiveArtworkSizes : [],
        printing_instructions: isCustomPrint ? effectivePrintingInstructions : null,
        pricing_tiers: product.pricing_tiers || [] // 🚨 Passed to Cart Store!
      })

      // 🚨 PHASE 7: Ghost File Bug Fix
      clearDraft(product.id)

      router.push('/checkout')
    } catch (error) {
      showToast('Checkout failed', 'error')
    } finally {
      setIsBuying(false)
    }
  }

  const isOutOfStock = (product?.stock ?? 0) <= 0
  const defaultClasses = "w-full h-11 flex items-center justify-center gap-2 text-[15px] font-medium bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full shadow-sm cursor-pointer disabled:opacity-60 transition-all"

  return (
    <button type="button" onClick={handleBuyNow} disabled={isBuying || isOutOfStock} className={className || defaultClasses}>
      {isBuying ? (
        <div className="w-4 h-4 border-2 border-[#0F1111] border-t-transparent rounded-full animate-spin" />
      ) : requireCustomizationChoice ? (
        <span>Customize & Buy</span>
      ) : (
        <span>Buy Now</span>
      )}
    </button>
  )
}