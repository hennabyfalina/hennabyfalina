// src/hooks/useCartSignature.ts

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCartStore } from '@/store/cart.store'
import { broadcast } from '@/lib/broadcast'

export function useCartSignature() {
  const [hasCartChanged, setHasCartChanged] = useState(false)
  const [initialSignature, setInitialSignature] = useState<string>('')
  const initialSignatureRef = useRef<string>('')

  const getCartSignature = useCallback(() => {
    // We ignore price here. Only product + printing + quantity defines the structural signature
    return useCartStore.getState().items
      .map(item => `${item.product_id}|${item.printing_type}|${item.quantity}`)
      .sort()
      .join(',')
  }, [])

  // Set the initial signature when the hook mounts
  useEffect(() => {
    const sig = getCartSignature()
    initialSignatureRef.current = sig
    setInitialSignature(sig)
  }, [getCartSignature])

  // Listen for broadcast events from other tabs
  useEffect(() => {
    const handleCartChange = () => {
      const currentSignature = getCartSignature()
      if (currentSignature !== initialSignatureRef.current) {
        setHasCartChanged(true)
      }
    }

    const unsubscribeUpdated = broadcast.on('CART_ITEM_UPDATED', handleCartChange)
    const unsubscribeAdded = broadcast.on('CART_ITEM_ADDED', handleCartChange)
    const unsubscribeDeleted = broadcast.on('CART_ITEM_DELETED', handleCartChange)
    
    return () => {
      unsubscribeUpdated()
      unsubscribeAdded()
      unsubscribeDeleted()
    }
  }, [getCartSignature])

  return { hasCartChanged, setHasCartChanged, getCartSignature, initialSignature }
}