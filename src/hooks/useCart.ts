import { useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart.store'

export const useCart = () => {
  const items = useCartStore((state) => state.items)
  const isLoading = useCartStore((state) => state.isLoading)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const loadCart = useCartStore((state) => state.loadCart)
  const refreshCartPrices = useCartStore((state) => state.refreshCartPrices)

  const hasRefreshed = useRef(false)

  useEffect(() => {
    if (!hasRefreshed.current) {
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
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    loadCart,
    refreshCartPrices,
  }
}