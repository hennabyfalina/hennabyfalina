'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/Toast'

export default function AdminRealtimeNotifier() {
  const router = useRouter()
  const knownStatesRef = useRef<Record<string, string>>({})
  const isFirstLoadRef = useRef(true)
  
  useEffect(() => {
    // Request Native OS Notification Permission for reliable Admin Alerts
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        // Check if online before attempting fetch to prevent TypeError: Failed to fetch
        if (typeof window !== 'undefined' && !window.navigator.onLine) return

        // Fetch the latest 10 orders to catch any rapid payment transitions
        const res = await fetch('/api/admin/orders?limit=10', {
          cache: 'no-store' // Bypass browser cache
        })

        if (!res.ok) return

        const orders = await res.json()
        if (orders && Array.isArray(orders)) {
          let shouldNotify = false
          let notifiedOrder = null

          orders.forEach(order => {
            const currentState = order.payment_status
            const previousState = knownStatesRef.current[order.id]
            
            if (!isFirstLoadRef.current) {
              // 🚨 Trigger ONLY when a pending order transitions to paid, 
              // OR if a brand new order comes in already paid!
              if (
                (previousState === 'pending' && currentState === 'paid') ||
                (!previousState && currentState === 'paid')
              ) {
                shouldNotify = true
                notifiedOrder = order
              }
            }
            
            knownStatesRef.current[order.id] = currentState
          })

          if (shouldNotify && notifiedOrder) {
            // 1. Play Notification Sound (if permitted by browser)
            try {
              const audio = new Audio('/notification.mp3') 
              audio.play().catch(() => console.log('Audio autoplay blocked by browser policy'))
            } catch (e) {}
            
            // 2. Show Visual Alert
            showToast(`New Order Received: ${(notifiedOrder as any).order_number}`, 'success')
            
            // 3. Native OS Notification (Guaranteed visibility outside browser tab and ignores CSS themes)
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('New Order Received! 🛍️', {
                body: `Order #${(notifiedOrder as any).order_number} has been placed successfully.`,
                icon: '/logo.png' 
              })
            }

            // 4. Refresh Dashboard Server Components
            router.refresh()
          }
          
          isFirstLoadRef.current = false
        }
      } catch (error) {
        console.error('Real-time polling error:', error)
      }
    }

    // Poll every 10 seconds for seamless tracking
    const intervalId = setInterval(checkNewOrders, 10000)
    checkNewOrders()
    
    return () => clearInterval(intervalId)
  }, [router])

  return null
}