// src/components/CartSyncProvider.tsx

'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart.store'
import { createClient } from '@/lib/supabase/client'

export default function CartSyncProvider() {
  useEffect(() => {
    // 🧹 PURGE OLD BROKEN CACHES TO FIX STUCK USERS
    localStorage.removeItem('hennabyfalina_storage')

    const handleStorageChange = (e: StorageEvent) => {
      // 🚀 FIXED: Pointing to the isolated cart storage key to prevent collision
      if (e.key === 'hennabyfalina_cart_storage') {
        useCartStore.persist.rehydrate()
        setTimeout(() => {
          useCartStore.setState({ isLoading: false })
        }, 50)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)

    // 🚀 NEW: Watch for Login events to instantly sync the guest cart to the DB
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const state = useCartStore.getState()
        if (state.items.length > 0) {
          console.log('🔄 Migrating guest cart to database upon login...')
          await state.syncWithDatabase(session.user.id)
        } else {
          await state.loadCart()
        }
      } else if (event === 'SIGNED_OUT') {
        useCartStore.getState().clearCart()
      }
    })
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      authListener.subscription.unsubscribe()
    }
  }, [])
  
  return null
}