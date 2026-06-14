// src/store/recentlyViewed.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product } from '@/types/database.types'

interface RecentlyViewedState {
  items: Product[]
  addViewedItem: (product: Product) => void
  clearViewedItems: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addViewedItem: (product) => set((state) => {
        const filtered = state.items.filter((p) => p.id !== product.id)
        return { items: [product, ...filtered].slice(0, 10) }
      }),
      clearViewedItems: () => set({ items: [] }),
    }),
    {
      name: 'hennabyfalina_recently_viewed', // 🔥 Clean isolated key prevents Cart overwrites
      storage: createJSONStorage(() => localStorage),
    }
  )
)