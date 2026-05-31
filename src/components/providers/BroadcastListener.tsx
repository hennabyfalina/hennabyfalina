'use client'

import { useEffect } from 'react'
import { broadcast } from '@/lib/broadcast'
import { useProductDraftStore } from '@/store/productDraft.store'

export default function BroadcastListener() {
  const clearDraftIfExists = useProductDraftStore((state) => state.clearDraftIfExists)

  useEffect(() => {
    const unsubscribeDeleted = broadcast.on('CART_ITEM_DELETED', (data) => {
      clearDraftIfExists(data.productId)
    })
    
    const unsubscribeAdded = broadcast.on('CART_ITEM_ADDED', (data) => {
      clearDraftIfExists(data.productId)
    })
    
    const unsubscribeUpdated = broadcast.on('CART_ITEM_UPDATED', (data) => {
      clearDraftIfExists(data.productId)
    })
    
    return () => {
      unsubscribeDeleted()
      unsubscribeAdded()
      unsubscribeUpdated()
    }
  }, [clearDraftIfExists])

  useEffect(() => {
    const cleanup = () => {
      useProductDraftStore.getState().cleanupOldDrafts(60)
    }
    cleanup()
    const interval = setInterval(cleanup, 10 * 60 * 1000) // every 10 min
    return () => clearInterval(interval)
  }, [])

  return null
}