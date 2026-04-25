// src/components/checkout/PaymentButton.tsx

'use client'

import { useState } from 'react'
import Script from 'next/script'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentButtonProps {
  onInitiate: () => Promise<{ orderId: string; orderNumber: string; amount: number }>
  onSuccess: (orderId?: string) => void
  onFailure: (error: string) => void
  disabled?: boolean
  amount: number
  buttonText?: string
  className?: string
}

export default function PaymentButton({
  onInitiate,
  onSuccess,
  onFailure,
  disabled = false,
  amount,
  buttonText,
  className,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Determine if we are in test mode (no Razorpay key configured)
      const isTestMode = !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

      const { orderId, orderNumber, amount: finalAmount } = await onInitiate()

      // If not in test mode and script isn't loaded, show error
      if (!isTestMode && !isScriptLoaded) {
        onFailure('Payment gateway is loading. Please try again.')
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      // Test Mode Logic: Simulate success or failure based on amount
      if (isTestMode) {
        console.warn('Test mode: No Razorpay key found. Simulating successful payment...')
        // For testing payment failure, use a specific amount (e.g., 1.00)
        if (finalAmount === 1.00) { 
          await supabase.from('orders').update({ payment_status: 'failed', status: 'pending', payment_failed_reason: 'Simulated test failure' }).eq('id', orderId)
          setTimeout(() => {
            onFailure('Simulated payment failed. Please try again with a different amount.')
            setIsLoading(false)
          }, 1500)
        } else {
          // Simulate successful payment for any other amount
          await supabase.from('orders').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', orderId)
          setTimeout(() => {
            onSuccess(orderId)
            setIsLoading(false)
          }, 1500)
        }
        return
      }

      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: finalAmount,
          orderId,
          orderNumber,
          userId: session.user.id
        }),
      })

      const order = await response.json()
      if (order.error) throw new Error(order.error)

      let localFailureReason = 'Payment cancelled'
      let isSuccess = false

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: siteConfig.name,
        description: `Order #${orderNumber}`,
        order_id: order.orderId,
        notes: {
          internal_order_id: orderId, // ← This is critical for webhook
        },
        handler: async function (response: any) {
          isSuccess = true
          setIsLoading(true)
          try {
            // Optimistic Update: Instantly mark as paid so the user doesn't wait for webhooks
            const { error } = await supabase.from('orders').update({
              payment_status: 'paid',
              status: 'confirmed',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              paid_at: new Date().toISOString()
            }).eq('id', orderId)
            if (error) console.error('Optimistic update error:', error)
          } catch (err) {
            console.error('Failed optimistic update', err)
          }
          onSuccess(orderId) // Proceed to redirect
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#E77600',
        },
        modal: {
          ondismiss: function () {
            if (isSuccess) return; // Prevent failure logic if payment succeeded
            setIsLoading(false)
            // Call onFailure IMMEDIATELY so the UI doesn't hang on the Confirm Order modal
            onFailure(localFailureReason)
            
            // Fire-and-forget DB update in the background so UI doesn't freeze
            supabase.from('orders').update({
              payment_status: 'failed',
              payment_failed_reason: localFailureReason
            }).eq('id', orderId).then()
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      
      // Listen for actual payment failures from the Gateway
      razorpay.on('payment.failed', function (response: any) {
        localFailureReason = response.error?.description || 'Payment failed at gateway'
        // Instantly update the DB with the real reason in the background
        supabase.from('orders').update({
          payment_status: 'failed',
          payment_failed_reason: localFailureReason
        }).eq('id', orderId).then()
      })
      
      razorpay.open()
    } catch (error: any) {
      onFailure(error.message || 'Failed to initialize payment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setIsScriptLoaded(true)}
        strategy="afterInteractive" // UX: Load faster to prevent blocking checkout
      />
      
      <button
        onClick={handlePayment}
        disabled={disabled || isLoading || !isScriptLoaded}
        className={className || "w-full py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none"}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          buttonText || 'Confirm & Pay'
        )}
      </button>
    </>
  )
}
