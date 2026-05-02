// src/app/(shop)/checkout/processing/page.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { Lock, ShieldCheck, Check, X } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    Razorpay: any
  }
}

type PaymentState = 'initializing' | 'processing' | 'success' | 'failed'

export default function ProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [paymentState, setPaymentState] = useState<PaymentState>('initializing')
  const [statusMessage, setStatusMessage] = useState('Securing your connection...')
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  
  // Ref prevents double-firing the Razorpay modal in React Strict Mode
  const hasTriggeredPayment = useRef(false)

  const orderId = searchParams.get('order_id')
  const amount = searchParams.get('amount')
  const razorpayOrderId = searchParams.get('rzp_order')

  // 🚨 STRICT MODE: Warn user if they try to close the tab or refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentState === 'initializing' || paymentState === 'processing') {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome/Edge to show the warning dialog
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [paymentState])

  // ... (keep the imports and setup the same)

  useEffect(() => {
    if (!orderId || !amount || !razorpayOrderId) {
      router.replace('/checkout')
      return
    }

    if (isScriptLoaded && !hasTriggeredPayment.current) {
      hasTriggeredPayment.current = true
      
      // 🚨 AMAZON DELAY: Wait 2.5 seconds so the user reads the security warnings
      setTimeout(() => {
        triggerRazorpay()
      }, 2500)
    }
  }, [isScriptLoaded, orderId, amount, razorpayOrderId, router])

  // ... (keep the triggerRazorpay function and return statement exactly the same)

  const triggerRazorpay = async () => {
    setPaymentState('processing')
    setStatusMessage('Waiting for payment completion...')
    const supabase = createClient()
    let localFailureReason = 'Payment cancelled by user'
    let isSuccess = false

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount,
      currency: 'INR',
      name: siteConfig.name,
      description: `Secure Payment`,
      order_id: razorpayOrderId,
      notes: {
        internal_order_id: orderId, 
      },
      handler: async function (response: any) {
        isSuccess = true
        setPaymentState('success')
        setStatusMessage('Payment successful! Thank you for your order.')
        
        try {
          // Optimistic update so the user doesn't have to wait for the webhook
          await supabase.from('orders').update({
            payment_status: 'paid',
            status: 'confirmed',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            paid_at: new Date().toISOString()
          }).eq('id', orderId)
        } catch (err) {
          console.error(err)
        }
        
        // Wait 2 seconds so they can read the success message, then redirect
        setTimeout(() => {
          router.replace(`/order/${encodeURIComponent(orderId || '')}`)
        }, 2000)
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#131921' }, // Amazon Black
      modal: {
        escape: false, // Prevents closing the modal by pressing ESC
        ondismiss: function () {
          if (isSuccess) return; 
          
          setPaymentState('failed')
          setStatusMessage('Payment was cancelled or failed. Redirecting...')
          
          // Fire-and-forget DB update in the background
          supabase.from('orders').update({
            payment_status: 'failed',
            payment_failed_reason: localFailureReason
          }).eq('id', orderId).then()
          
          // Wait 2 seconds so they can see the failure UI, then redirect
          setTimeout(() => {
            router.replace('/profile/orders?filter=failed')
          }, 2000)
        },
      },
    }

    try {
      const razorpay = new window.Razorpay(options)
      
      // Listen for actual gateway failures (insufficient funds, bad network)
      razorpay.on('payment.failed', function (response: any) {
        localFailureReason = response.error?.description || 'Payment failed at gateway'
        supabase.from('orders').update({
          payment_status: 'failed',
          payment_failed_reason: localFailureReason
        }).eq('id', orderId).then()
      })
      
      razorpay.open()
    } catch (error) {
      setPaymentState('failed')
      setStatusMessage('Failed to load payment gateway. Redirecting to checkout...')
      setTimeout(() => {
        router.replace('/checkout')
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-4 animate-in fade-in duration-300">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setIsScriptLoaded(true)}
        strategy="afterInteractive"
      />
      
      {/* INITIALIZING / PROCESSING STATE */}
      {(paymentState === 'initializing' || paymentState === 'processing') && (
        <div className="bg-white p-8 md:p-12 max-w-md w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Lock className="w-8 h-8 text-[#007185] animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F1111] mb-2 tracking-tight">Processing Secure Payment</h2>
          <p className="text-gray-600 mb-8 font-medium text-sm">{statusMessage}</p>
          
          <div className="flex justify-center mb-8">
            <div className="w-10 h-10 border-4 border-[#007185]/30 border-t-[#007185] rounded-full animate-spin"></div>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4 flex items-center justify-center gap-2 text-sm text-gray-700 border border-gray-200 w-full">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <span className="font-medium text-left leading-tight">Please do not refresh, go back, or close this window.</span>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {paymentState === 'success' && (
        <div className="bg-white p-8 md:p-12 max-w-md w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F1111] mb-2 tracking-tight">Payment Successful</h2>
          <p className="text-gray-600 mb-8 font-medium text-sm">{statusMessage}</p>
          <div className="flex items-center gap-3 text-sm text-green-800 font-bold bg-green-50 px-5 py-3 rounded-full border border-green-200 shadow-sm">
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            Redirecting to receipt...
          </div>
        </div>
      )}

      {/* FAILED STATE */}
      {paymentState === 'failed' && (
        <div className="bg-white p-8 md:p-12 max-w-md w-full text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F1111] mb-2 tracking-tight">Transaction Declined</h2>
          <p className="text-gray-600 mb-8 font-medium text-sm">{statusMessage}</p>
          <div className="flex items-center gap-3 text-sm text-red-800 font-bold bg-red-50 px-5 py-3 rounded-full border border-red-200 shadow-sm">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            Returning to merchant...
          </div>
        </div>
      )}
    </div>
  )
}