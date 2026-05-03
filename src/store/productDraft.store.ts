// src/store/productDraft.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
  artworks: ArtworkFile[]    // full metadata (for UI preview)
  isAgreementChecked: boolean
  minQty: number
  days: number
  redirectedForLogin?: boolean  // flag to show friendly message after login
}

interface ProductDraftState {
  drafts: Record<string, ProductDraft>
  getDraft: (productId: string) => ProductDraft | undefined
  setDraft: (productId: string, draft: ProductDraft) => void
  clearDraft: (productId: string) => void
  setRedirectedFlag: (productId: string, value: boolean) => void
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
    }),
    {
      name: 'razack-product-drafts', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)