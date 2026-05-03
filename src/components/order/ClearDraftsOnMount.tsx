// src/components/order/ClearDraftsOnMount.tsx

'use client'

import { useEffect } from 'react'
import { useProductDraftStore } from '@/store/productDraft.store'

interface ClearDraftsOnMountProps {
  productIds: string[]
}

export default function ClearDraftsOnMount({ productIds }: ClearDraftsOnMountProps) {
  const clearDraft = useProductDraftStore((state) => state.clearDraft)

  useEffect(() => {
    // Clear drafts for all products in this order
    productIds.forEach((pid) => clearDraft(pid))
  }, [productIds, clearDraft])

  return null
}