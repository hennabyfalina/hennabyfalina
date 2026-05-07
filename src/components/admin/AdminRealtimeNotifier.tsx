'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/Toast'

export default function AdminRealtimeNotifier() {
  const router = useRouter()
  const lastOrderIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        // Fetch only the single latest order to keep it extremely lightweight
        const res = await fetch('/api/admin/orders?limit=1', {
          cache: 'no-store' // Bypass browser cache
        })
        
        if (!res.ok) return
        
        const orders = await res.json()
        if (orders && orders.length > 0) {
          const latestOrder = orders[0]
          
          if (lastOrderIdRef.current === null) {
            // First load: just memorize the latest order ID
            lastOrderIdRef.current = latestOrder.id
          } else if (lastOrderIdRef.current !== latestOrder.id) {
            // A new order has appeared!
            lastOrderIdRef.current = latestOrder.id
            
            // 1. Play Notification Sound
            try {
              const audio = new Audio('/notification.mp3') 
              audio.play().catch(() => console.log('Audio autoplay blocked by browser policy'))
            } catch (e) {}
            
            // 2. Show Visual Alert
            showToast(`New Order Received: ${latestOrder.order_number}!`, 'success')
            
            // 3. Magically refresh the Server Components (Dashboard) to update numbers!
            router.refresh()
          }
        }
      } catch (error) {
        console.error('Real-time polling error:', error)
      }
    }

    // Check the database every 15 seconds
    // This uses negligible bandwidth and works 100% free without WebSockets
    const intervalId = setInterval(checkNewOrders, 15000)
    
    return () => clearInterval(intervalId)
  }, [router])

  return null
}