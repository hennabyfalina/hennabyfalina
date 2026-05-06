// src/components/order/RetryPaymentButton.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

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

      // Erase from history stack
      router.replace(`/checkout/processing?order_id=${orderId}&amount=${razorpayData.amount}&rzp_order=${razorpayData.orderId}&retry=true`)
    } catch (error: any) {
      showToast(error.message || 'Failed to initialize payment')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={isLoading}
      className="px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
      ) : (
        'Complete Payment'
      )}
    </button>
  )
}