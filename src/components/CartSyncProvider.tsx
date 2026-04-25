'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart.store'

export default function CartSyncProvider() {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'razack-cart-storage') {
        // Force rehydration of the store
        useCartStore.persist.rehydrate()
        // Also manually trigger a re-render by setting a small timeout
        setTimeout(() => {
          useCartStore.setState({ isLoading: false })
        }, 50)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  return null
}