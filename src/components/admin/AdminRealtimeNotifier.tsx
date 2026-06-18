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

  const handleNewOrderNotification = useCallback((order: any) => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    } catch (e) {}

    showToast(`New Order Received: #${order.order_number}`, 'success')
    
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received! 🛍️', {
        body: `Order #${order.order_number} has been placed successfully.`
      })
    }

    router.refresh()
  }, [router])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

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