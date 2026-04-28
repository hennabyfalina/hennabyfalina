// src/components/providers/WishlistProvider.tsx

'use client'

import { useEffect } from 'react'
import { useWishlistStore } from '@/store/wishlist.store'

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const initializeWishlist = useWishlistStore((state) => state.initializeWishlist)

  useEffect(() => {
    initializeWishlist()
  }, [initializeWishlist])

  return <>{children}</>
}