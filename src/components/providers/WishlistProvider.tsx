// src/components/providers/WishlistProvider.tsx

'use client'

import { useEffect } from 'react'
import { useWishlistStore } from '@/store/wishlist.store'
import { useAuth } from '@/hooks/useAuth'

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const initializeWishlist = useWishlistStore((state) => state.initializeWishlist)
  const toggleItem = useWishlistStore((state) => state.toggleItem)
  const { user, isLoading: authLoading } = useAuth()

  // Initialize wishlist on mount
  useEffect(() => {
    initializeWishlist()
  }, [initializeWishlist])

  // Handle pending wishlist after user becomes authenticated
  useEffect(() => {
    if (!authLoading && user) {
      const pendingProductId = sessionStorage.getItem('pendingWishlist')
      if (pendingProductId) {
        // Clear immediately to avoid duplicate processing
        sessionStorage.removeItem('pendingWishlist')
        // Add to wishlist automatically
        toggleItem(pendingProductId).catch(console.error)
      }
    }
  }, [authLoading, user, toggleItem])

  return <>{children}</>
}