// src/hooks/useCart.ts

import { useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart.store'

export const useCart = () => {
  const items = useCartStore((state) => state.items)
  const isLoading = useCartStore((state) => state.isLoading)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  
  // ⚡ OPTIMIZATION: Pull computed values using Zustand selectors natively
  const totalItems = useCartStore((state) => state.getTotalItems())
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  
  const loadCart = useCartStore((state) => state.loadCart)
  const refreshCartPrices = useCartStore((state) => state.refreshCartPrices)

  const hasRefreshed = useRef(false)

  useEffect(() => {
    if (!hasRefreshed.current) {
      // Automatically triggers our dynamic price drift & catalog safety shield on mount
      refreshCartPrices()
      hasRefreshed.current = true
    }
  }, [refreshCartPrices])

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    loadCart,
    refreshCartPrices,
  }
}