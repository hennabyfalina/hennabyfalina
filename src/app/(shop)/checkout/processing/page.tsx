// src/app/(shop)/checkout/processing/page.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, ShieldCheck, Check, X } from 'lucide-react'
import { siteConfig } from '@/config/site'
// ❌ REMOVED: import { createClient } from '@/lib/supabase/client'

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
  
  const hasTriggeredPayment = useRef(false)

  const orderId = searchParams.get('order_id')
  const amount = searchParams.get('amount')
  const razorpayOrderId = searchParams.get('rzp_order')
  
  // 🚨 SMART ROUTING: If they are retrying a payment, send them back to the order page on failure instead of the cart
  const isRetry = searchParams.get('retry') === 'true'
  const fallbackUrl = isRetry && orderId ? `/order/${encodeURIComponent(orderId)}` : '/cart?payment_failed=true'


  // 🚨 CRITICAL FIX: Robust Script Loader to prevent infinite loops and handle AdBlockers
  useEffect(() => {
    let checkInterval: NodeJS.Timeout
    let isMounted = true
    
    if (typeof window !== 'undefined') {
      const scriptId = 'razorpay-checkout-js'
      let script = document.getElementById(scriptId) as HTMLScriptElement

      if (!script) {
        script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        
        script.onerror = () => {
          if (isMounted) {
            setPaymentState('failed')
            setStatusMessage('Payment gateway blocked. Please disable adblockers and try again.')
            setTimeout(() => router.replace(fallbackUrl), 3000)
          }
        }
        
        document.body.appendChild(script)
      }

      let attempts = 0
      checkInterval = setInterval(() => {
        attempts++
        if (window.Razorpay) {
          if (isMounted) setIsScriptLoaded(true)
          clearInterval(checkInterval)
        } else if (attempts > 150) { // 15 seconds timeout
          clearInterval(checkInterval)
          if (isMounted) {
            setPaymentState('failed')
            setStatusMessage('Payment gateway took too long to load. Please check your internet connection.')
            setTimeout(() => router.replace(fallbackUrl), 3000)
          }
        }
      }, 100)
    }

    return () => {
      isMounted = false
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [])

  // Warn on tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentState === 'initializing' || paymentState === 'processing') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [paymentState])

  useEffect(() => {
    if (!orderId || !amount || !razorpayOrderId) {
      router.replace('/checkout')
      return
    }

    if (isScriptLoaded && !hasTriggeredPayment.current) {
      hasTriggeredPayment.current = true
      setTimeout(() => {
        triggerRazorpay()
      }, 500) // 🚨 Reduced wait time for snappier experience
    }
  }, [isScriptLoaded, orderId, amount, razorpayOrderId, router])

  const triggerRazorpay = async () => {
    setPaymentState('processing')
    setStatusMessage('Waiting for payment completion...')
    
    // ✅ REMOVED: Optimistic DB update – webhook is the source of truth
    // We do NOT update order status here anymore.

    let isSuccess = false

    const finalKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!finalKey) {
      setPaymentState('failed')
      setStatusMessage('Configuration error: Payment key missing. Redirecting...')
      setTimeout(() => router.replace(fallbackUrl), 3000)
      return
    }

    const options = {
      key: finalKey,
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
        
        // ✅ REMOVED: Direct DB update – webhook will handle it
        // Just wait and redirect to order page
        setTimeout(() => {
          router.replace(`/order/${encodeURIComponent(orderId || '')}`)
        }, 2000)
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#131921' },
      modal: {
        escape: false,
        ondismiss: function () {
          if (isSuccess) return; 
          
          setPaymentState('failed')
          setStatusMessage('Payment was cancelled or failed. Redirecting...')
          
          // ❌ REMOVED: Optimistic DB update – webhook will handle failure
          
          // 🚨 Push to appropriate fallback page securely
          setTimeout(() => {
            router.replace(fallbackUrl)
          }, 1500)
        },
      },
    }

    try {
      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response: any) {
        // Webhook will update the order status
        console.log('[Razorpay] Payment failed:', response.error)
      })
      razorpay.open()
    } catch (error) {
      setPaymentState('failed')
      setStatusMessage('Failed to load payment gateway. Redirecting...')
      setTimeout(() => {
        router.replace(fallbackUrl)
      }, 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-4 animate-in fade-in duration-300">
      
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
          <div className="bg-gray-50 rounded-md p-4 flex items-center justify-center border border-gray-200 w-full">
            <p className="text-xs md:text-sm font-bold text-gray-700 leading-relaxed text-center">
              Please do not refresh, go back, or close this window.
            </p>
          </div>
        </div>
      )}

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