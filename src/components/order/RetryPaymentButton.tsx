// src/components/order/RetryPaymentButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { siteConfig } from '@/config/site'
import SecureLoadingOverlay from '@/components/checkout/SecureLoadingOverlay'

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
        theme: { color: '#000000' },
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
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        console.error('[Retry] Payment failed:', response.error)
        showToast(response.error?.description || 'Payment failed. Please try another method.', 'error')
        setIsLoading(false)
      })
      rzp.open()

    } catch (error: any) {
      showToast(error.message || 'Failed to initialize payment')
      setIsLoading(false)
    }
  }

  return (
    <>
      <SecureLoadingOverlay isProcessing={isLoading} />
    <button
      onClick={handleRetry}
      disabled={isLoading}
      className="h-10 px-4 bg-black hover:bg-stone-900 text-white font-semibold rounded-full text-[13px] transition-colors flex items-center justify-center capitalize w-full shadow-none text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        'Complete Payment'
      )}
    </button>
    </>
  )
}