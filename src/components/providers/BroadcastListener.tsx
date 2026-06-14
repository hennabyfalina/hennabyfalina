// src/components/providers/BroadcastListener.tsx

'use client'

import { useEffect } from 'react'
import { broadcast } from '@/lib/broadcast'
import { useCartStore } from '@/store/cart.store'

export default function BroadcastListener() {
  useEffect(() => {
    // ⚡ CROSS-TAB SYNC ENGINE
    // 🚀 FIXED: We ONLY rehydrate local storage. Removed loadCart() here to prevent race conditions 
    // where stale DB data overwrites fresh local storage before the DB insert finishes!
    const handleSync = async () => {
      await useCartStore.persist.rehydrate()
    }

    const unsubscribeDeleted = broadcast.on('CART_ITEM_DELETED', handleSync)
    const unsubscribeAdded = broadcast.on('CART_ITEM_ADDED', handleSync)
    const unsubscribeUpdated = broadcast.on('CART_ITEM_UPDATED', handleSync)
    
    return () => {
      unsubscribeDeleted()
      unsubscribeAdded()
      unsubscribeUpdated()
    }
  }, [])

  return null
}