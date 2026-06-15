// src/hooks/useRazorpayCheckout.ts

'use client'

import { useState, useCallback, useRef } from 'react'
import { createOrder } from '@/services/order.service'
import { useCartStore } from '@/store/cart.store'
import { siteConfig } from '@/config/site'
import { generateIdempotencyKey } from '@/lib/idempotency'

interface CheckoutPayload {
  user: any
  items: any[]
  finalTotal: number
  shippingMethod: 'delivery' | 'pickup'
  shippingCost: number
  selectedAddressId: string | null
  checkoutSessionId: string
  formData: any
}

export function useRazorpayCheckout() {
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const clearCart = useCartStore((state) => state.clearCart)
  
  const isProcessingRef = useRef(false)
  const currentIdempotencyKeyRef = useRef<string | null>(null)

  const processPayment = useCallback(async (payload: CheckoutPayload) => {
    const { user, items, finalTotal, shippingMethod, shippingCost, selectedAddressId, formData, checkoutSessionId } = payload
    
    if (isProcessingRef.current) return
    
    if (!user) {
      setCheckoutError('please log in to continue')
      return
    }
    
    isProcessingRef.current = true
    setIsProcessingCheckout(true)
    setCheckoutError(null)

    if (finalTotal <= 0) {
      setCheckoutError('unable to process order. please refresh and try again.')
      isProcessingRef.current = false
      setIsProcessingCheckout(false)
      return
    }

    const baseIdempotencyKey = generateIdempotencyKey('session')
    currentIdempotencyKeyRef.current = baseIdempotencyKey

    try {
      const addressData: any = { shippingMethod }

      if (shippingMethod === 'delivery') {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAddressId || '')
        if (!selectedAddressId || !isValidUuid) {
          throw new Error('please select a valid delivery address before placing your order.')
        }
        addressData.addressId = selectedAddressId
      } else {
        addressData.pickupContact = {
          name: formData.name,
          phone: formData.phone,
          pincode: formData.pincode,
        }
      }

      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: finalTotal,
        shippingCost: shippingCost,
        paymentMethod: 'razorpay',
        shippingMethod,
        sessionId: checkoutSessionId,
        idempotencyKey: `${baseIdempotencyKey}_order`,
        addressData,
      }

      const order = await createOrder(orderData)
      await clearCart()

      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': `${baseIdempotencyKey}_payment`
        },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          userId: user.id,
          idempotencyKey: `${baseIdempotencyKey}_payment`
        })
      })

      if (!response.ok) {
        throw new Error('failed to initialize secure payment session')
      }

      const data = await response.json()

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: siteConfig.name,
        description: `Order #${order.order_number}`,
        order_id: data.orderId,
        prefill: {
          name: formData.name || user?.user_metadata?.full_name || '',
          email: user?.email || '',
          contact: formData.phone || ''
        },
        notes: {
          order_number: order.order_number,
          order_id: order.id,
          shipping_method: shippingMethod
        },
        theme: { color: '#000000' },
        handler: async function (response: any) {
          setIsProcessingCheckout(true) // Maintain loader visual during secure validation loops
          try {
            const res = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                internal_order_id: order.id
              })
            })
            if (!res.ok) throw new Error('Payment token tracking validation signature check rejected.')
            
            window.location.href = `/order/${order.id}?new_order=true`
          } catch (e) {
            console.warn('[Checkout Fallback Switch]:', e)
            window.location.href = `/profile/orders?filter=verifying`
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessingCheckout(false)
            isProcessingRef.current = false
            window.location.href = `/profile/orders?filter=failed`
          }
        }
      }
      
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function () {
        setIsProcessingCheckout(false)
        isProcessingRef.current = false
        window.location.href = `/profile/orders?filter=failed`
      })
      rzp.open()

    } catch (err: any) {
      setCheckoutError(err.message || 'an unexpected configuration glitch happened.')
      setIsProcessingCheckout(false)
      isProcessingRef.current = false
    }
  }, [clearCart])

  return { processPayment, isProcessingCheckout, checkoutError }
}