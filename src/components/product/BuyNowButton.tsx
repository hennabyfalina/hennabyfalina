// src/components/product/BuyNowButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { useQuickViewStore } from '@/store/quickview.store'
import { useProductDraftStore } from '@/store/productDraft.store'
import { showToast } from '@/components/ui/Toast'
import { B2B_CONSTANTS } from '@/config/b2b-rules'

interface BuyNowButtonProps {
  product: any
  quantity?: number
  printingType?: string
  artworkUrls?: string[] | null
  artworkSizes?: number[] | null
  printingInstructions?: string | null
  className?: string
  requireCustomizationChoice?: boolean
}

export default function BuyNowButton({
  product,
  quantity = 1,
  printingType: propPrintingType,
  artworkUrls: propArtworkUrls,
  artworkSizes: propArtworkSizes,
  printingInstructions: propPrintingInstructions = null,
  className = '',
  requireCustomizationChoice = false
}: BuyNowButtonProps) {
  const [isBuying, setIsBuying] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const closeQuickView = useQuickViewStore((state) => state.closeQuickView)
  const router = useRouter()

  const draft = useProductDraftStore((state) => state.drafts[product.id])

  const effectivePrintingType = propPrintingType ?? draft?.printingType ?? 'Retail (Readymade)'
  const effectiveArtworkUrls = propArtworkUrls !== undefined && propArtworkUrls !== null ? propArtworkUrls : (draft?.artworkUrls ?? [])
  const effectiveArtworkSizes = propArtworkSizes !== undefined && propArtworkSizes !== null ? propArtworkSizes : (draft?.artworkSizes ?? [])
  const effectivePrintingInstructions = propPrintingInstructions !== null ? propPrintingInstructions : (draft?.instructions ?? null)
  const effectiveIsAgreementChecked = draft?.isAgreementChecked ?? true
  const effectiveMinQuantity = draft?.minQty ?? B2B_CONSTANTS.RETAIL_MIN_QTY

  // 🚨 SANITIZE INPUTS
  const isCustomPrint = effectivePrintingType.includes('Single Color') || effectivePrintingType.includes('Multi Color')
  const finalArtworkUrls = isCustomPrint ? effectiveArtworkUrls : []
  const finalArtworkSizes = isCustomPrint ? effectiveArtworkSizes : []
  const finalPrintingInstructions = isCustomPrint ? effectivePrintingInstructions : null

  // 🚨 VALIDATION FUNCTION (same as AddToCartButton)
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

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (requireCustomizationChoice) {
      closeQuickView()
      router.push(`/product/${encodeURIComponent(product.slug)}?customize=true#b2b-options`)
      return
    }

    // 🚨 RUN VALIDATION
    const validation = validateCustomPrint()
    if (!validation.valid) {
      showToast(validation.message!, 'error')
      return
    }

    const safeStock = product?.stock ?? 99999

    if (!product || safeStock <= 0) {
      showToast('Out of stock', 'error')
      return
    }

    setIsBuying(true)
    const sellingPrice = product.selling_price ?? product.price ?? 0

    const finalPrice = product.bulk_price && (quantity >= (product.bulk_min_quantity || B2B_CONSTANTS.WHOLESALE_MIN_QTY))
      ? product.bulk_price
      : sellingPrice

    try {
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
        bulk_price: product.bulk_price || null,
        bulk_min_quantity: product.bulk_min_quantity || null,
        rating: product.rating || null,
        review_count: product.review_count || null,
        selling_price: sellingPrice,
        printing_type: effectivePrintingType,
        artwork_urls: finalArtworkUrls,
        artwork_sizes: finalArtworkSizes,
        printing_instructions: finalPrintingInstructions,
      })

      router.push('/checkout')
    } catch (error) {
      showToast('Failed to proceed to checkout', 'error')
    } finally {
      setIsBuying(false)
    }
  }

  const isOutOfStock = (product?.stock ?? 99999) <= 0
  const defaultClasses = "w-full h-11 flex items-center justify-center gap-2 text-[15px] font-medium bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00] rounded-full shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"

  return (
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={isBuying || isOutOfStock}
      className={className || defaultClasses}
    >
      {isBuying ? (
        <>
          <div className="w-4 h-4 border-2 border-[#0F1111] border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : requireCustomizationChoice ? (
        <span>Customize & Buy</span>
      ) : (
        <span>Buy Now</span>
      )}
    </button>
  )
}