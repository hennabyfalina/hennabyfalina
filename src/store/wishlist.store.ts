// src/store/wishlist.store.ts

import { create } from 'zustand'
import { toggleWishlistItem, getUserWishlistIds } from '@/services/wishlist.service'

interface WishlistState {
  savedProductIds: string[]
  isLoading: boolean
  isInitialized: boolean
  
  initializeWishlist: () => Promise<void>
  toggleItem: (productId: string) => Promise<boolean>
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  savedProductIds: [],
  isLoading: false,
  isInitialized: false,

  initializeWishlist: async () => {
    if (get().isInitialized) return
    
    set({ isLoading: true })
    try {
      const ids = await getUserWishlistIds()
      set({ savedProductIds: ids, isInitialized: true })
    } catch (error) {
      console.error('Failed to initialize wishlist', error)
    } finally {
      set({ isLoading: false })
    }
  },

  toggleItem: async (productId: string) => {
    const currentIds = get().savedProductIds
    const isCurrentlySaved = currentIds.includes(productId)
    
    // OPTIMISTIC UPDATE: Instantly change the UI heart to Red
    if (isCurrentlySaved) {
      set({ savedProductIds: currentIds.filter(id => id !== productId) })
    } else {
      set({ savedProductIds: [...currentIds, productId] })
    }

    // Background DB update
    const response = await toggleWishlistItem(productId)
    
    if (!response.success) {
      // 🚨 Rollback the UI if the database failed (e.g. user wasn't logged in)
      set({ savedProductIds: currentIds })
      
      if (response.error === 'unauthorized') {
        throw new Error('unauthorized')
      }
      throw new Error('Failed to toggle')
    }
    
    return response.added!
  },

  clearWishlist: () => {
    set({ savedProductIds: [], isInitialized: false })
  }
}))