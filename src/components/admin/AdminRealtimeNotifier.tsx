// src/components/admin/AdminRealtimeNotifier.tsx

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

export default function AdminRealtimeNotifier() {
  const router = useRouter()
  const supabase = createClient()
  const isFirstLoadRef = useRef(true)

  // 1. Wrap in useCallback to ensure initialization before useEffect execution
  const handleNewOrderNotification = useCallback((order: any) => {
    // Play sound
    try {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    } catch (e) {}

    // Show visual feedback
    showToast(`New Order Received: #${order.order_number}`, 'success')
    
    // Native OS Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received! 🛍️', {
        body: `Order #${order.order_number} has been placed successfully.`,
        icon: '/logo.png'
      })
    }

    // Refresh Dashboard Data
    router.refresh()
  }, [router])

  useEffect(() => {
    // 1. Request Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    // 2. Initialize Realtime Subscription
    const channel = supabase
      .channel('admin-order-notifier')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        },
        (payload) => {
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false
            return
          }

          const newOrder = payload.new as any
          
          // Now safe to call
          handleNewOrderNotification(newOrder)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, handleNewOrderNotification])

  return null
}