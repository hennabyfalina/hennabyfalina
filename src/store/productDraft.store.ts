// src/store/productDraft.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { B2B_CONSTANTS } from '@/config/b2b-rules'
import type { CartItem } from '@/store/cart.store'

export interface ArtworkFile {
  path: string
  url: string
  name: string
  size: number
}

export interface ProductDraft {
  printingType: string
  instructions: string
  artworkUrls: string[]      // array of paths (for storing in cart/order)
  artworkSizes?: number[]    // size tracking for 15MB limit
  artworks: ArtworkFile[]    // full metadata (for UI preview)
  isAgreementChecked: boolean
  minQty: number
  days: number
  redirectedForLogin?: boolean  // flag to show friendly message after login
  hydratedFromCart?: boolean    // flag to track source
}

interface ProductDraftState {
  drafts: Record<string, ProductDraft>
  getDraft: (productId: string) => ProductDraft | undefined
  setDraft: (productId: string, draft: ProductDraft) => void
  clearDraft: (productId: string) => void
  setRedirectedFlag: (productId: string, value: boolean) => void
  hydrateFromCart: (productId: string, cartItem: CartItem) => void
}

export const useProductDraftStore = create<ProductDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft: (productId) => get().drafts[productId],

      setDraft: (productId, draft) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [productId]: draft,
          },
        })),

      clearDraft: (productId) =>
        set((state) => {
          const { [productId]: _, ...rest } = state.drafts
          return { drafts: rest }
        }),

      setRedirectedFlag: (productId, value) =>
        set((state) => {
          const existing = state.drafts[productId]
          if (!existing) return state
          return {
            drafts: {
              ...state.drafts,
              [productId]: { ...existing, redirectedForLogin: value },
            },
          }
        }),

      hydrateFromCart: (productId, cartItem) => {
        // 🚀 Reconstruct the artworks array for UI preview
        const reconstructedArtworks = (cartItem.artwork_urls || []).map((path, idx) => ({
          path: path,
          url: `/api/artwork?path=${encodeURIComponent(path)}`,
          name: path.split('/').pop() || `File ${idx + 1}`,
          size: cartItem.artwork_sizes?.[idx] || 0
        }))

        const draft: ProductDraft = {
          printingType: cartItem.printing_type || 'Retail (Readymade)',
          instructions: cartItem.printing_instructions || '',
          artworkUrls: cartItem.artwork_urls || [],
          artworkSizes: cartItem.artwork_sizes || [],
          artworks: reconstructedArtworks,
          isAgreementChecked: true,
          minQty: cartItem.quantity >= B2B_CONSTANTS.WHOLESALE_MIN_QTY
            ? B2B_CONSTANTS.WHOLESALE_MIN_QTY
            : B2B_CONSTANTS.RETAIL_MIN_QTY,
          days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS,
          hydratedFromCart: true,
        }
        set((state) => ({
          drafts: { ...state.drafts, [productId]: draft },
        }))
      },
    }),
    {
      name: 'razack-product-drafts', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)