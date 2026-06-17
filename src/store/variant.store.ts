// src/store/variant.store.ts

import { create } from 'zustand'
import type { ProductVariant } from '@/lib/pricing'

export type Variant = ProductVariant

interface VariantState {
  variants: Variant[]
  selectedVariant: Variant | null
  setVariants: (variants: Variant[]) => void
  setSelectedVariant: (variant: Variant | null) => void
  reset: () => void
}

export const useVariantStore = create<VariantState>((set) => ({
  variants: [],
  selectedVariant: null,
  setVariants: (variants) => set({ variants, selectedVariant: variants[0] || null }),
  setSelectedVariant: (variant) => set({ selectedVariant: variant }),
  reset: () => set({ variants: [], selectedVariant: null }),
}))