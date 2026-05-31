// src/store/productDraft.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
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
  artworkUrls: string[]      
  artworkSizes?: number[]    
  artworks: ArtworkFile[]    
  isArtworkRightsChecked: boolean
  isPrintTimelineChecked: boolean
  minQty: number
  days: number
  redirectedForLogin?: boolean  
  hydratedFromCart?: boolean
  lastUpdated: number
}

interface ProductDraftState {
  drafts: Record<string, ProductDraft>
  getDraft: (productId: string) => ProductDraft | undefined
  setDraft: (productId: string, draft: ProductDraft) => void
  clearDraft: (productId: string) => void
  clearDraftIfExists: (productId: string) => void
  setRedirectedFlag: (productId: string, value: boolean) => void
  hydrateFromCart: (productId: string, cartItem: CartItem) => void
  cleanupOldDrafts: (maxAgeMinutes?: number) => void
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
            [productId]: { ...draft, lastUpdated: Date.now() },
          },
        })),
      clearDraft: (productId) =>
        set((state) => {
          const { [productId]: _, ...rest } = state.drafts
          return { drafts: rest }
        }),
      clearDraftIfExists: (productId) =>
        set((state) => {
          if (state.drafts[productId]) {
            const { [productId]: _, ...rest } = state.drafts
            return { drafts: rest }
          }
          return state
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
          isArtworkRightsChecked: true,
          isPrintTimelineChecked: true,
          minQty: cartItem.quantity >= 1000 ? 1000 : 100, // Safe default fallback
          days: 7, // Safe default fallback
          hydratedFromCart: true,
          lastUpdated: Date.now()
        }
        set((state) => ({
          drafts: { ...state.drafts, [productId]: draft },
        }))
      },
      cleanupOldDrafts: (maxAgeMinutes = 60) => {
        const now = Date.now()
        const maxAge = maxAgeMinutes * 60 * 1000
        set((state) => {
          const newDrafts = { ...state.drafts }
          let changed = false
          for (const [id, draft] of Object.entries(newDrafts)) {
            if (draft.lastUpdated && now - draft.lastUpdated > maxAge) {
              delete newDrafts[id]
              changed = true
            }
          }
          return changed ? { drafts: newDrafts } : state
        })
      },
    }),
    {
      name: 'razack-product-drafts',
      storage: createJSONStorage(() => localStorage),
    }
  )
)