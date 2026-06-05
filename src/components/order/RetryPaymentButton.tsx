// src/components/order/RetryPaymentButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { siteConfig } from '@/config/site'

interface RetryPaymentButtonProps {
  orderId: string
  orderNumber: string
  amount: number
}

export default function RetryPaymentButton({ orderId, orderNumber, amount }: RetryPaymentButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRetry = async () => {
    setIsLoading(true)
    
    // Add blur effect to the main content
    const mainContent = document.querySelector('main') || document.body;
    const originalFilter = mainContent.style.filter;
    const originalTransition = mainContent.style.transition;
    mainContent.style.transition = 'filter 0.3s ease';
    mainContent.style.filter = 'blur(8px)';

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Dynamically load the Razorpay SDK
      const isScriptLoaded = await new Promise((resolve) => {
        if ((window as any).Razorpay) return resolve(true)
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
      if (!isScriptLoaded) throw new Error('Razorpay SDK failed to load. Please check your connection.')

      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId,
          orderNumber,
          userId: user.id
        }),
      })

      const razorpayData = await response.json()
      if (razorpayData.error) throw new Error(razorpayData.error)

      // Open Razorpay Modal directly
      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: siteConfig.name,
        description: `Order #${orderNumber}`,
        order_id: razorpayData.orderId,
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        notes: {
          order_number: orderNumber,
          order_id: orderId,
        },
        theme: { color: '#007185' },
        handler: async function (response: any) {
          // ⚡ OPTIMIZATION: Eagerly verify to ensure the DB reflects "paid" instantly
          try {
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                internal_order_id: orderId
              })
            })
          } catch (e) {
            console.warn('[Retry] Eager verification bypassed, falling back to webhook.')
          }

          router.replace(`/order/${orderId}?new_order=true`)
          mainContent.style.filter = originalFilter;
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false)
            mainContent.style.filter = originalFilter;
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        console.error('[Retry] Payment failed:', response.error)
        showToast(response.error?.description || 'Payment failed. Please try another method.', 'error')
        setIsLoading(false)
        mainContent.style.filter = originalFilter;
      })
      rzp.open()

    } catch (error: any) {
      showToast(error.message || 'Failed to initialize payment')
      setIsLoading(false)
      mainContent.style.filter = originalFilter;
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={isLoading}
      className="px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
      ) : (
        'Complete Payment'
      )}
    </button>
  )
}