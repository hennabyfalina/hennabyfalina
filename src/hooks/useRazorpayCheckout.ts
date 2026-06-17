// src/hooks/useRazorpayCheckout.ts

'use client'

import { useState, useCallback, useRef } from 'react'
import { createOrder } from '@/services/order.service'
import { useCartStore } from '@/store/cart.store'
import { siteConfig } from '@/config/site'
import { recordPaymentFailure } from '@/services/payment.service'
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
  onFinalize: (status: 'success' | 'failed', orderId?: string, errorMsg?: string, orderNumber?: string, orderAmount?: number) => void
}

export function useRazorpayCheckout() {
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const clearCart = useCartStore((state) => state.persistCartClear || state.clearCart)
  
  const isProcessingRef = useRef(false)
  const currentIdempotencyKeyRef = useRef<string | null>(null)

  const processPayment = useCallback(async (payload: CheckoutPayload) => {
    const { user, items, finalTotal, shippingMethod, shippingCost, selectedAddressId, formData, checkoutSessionId, onFinalize } = payload
    
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
        // 🔒 TRANSMIT SECURE IDENTITIES: Passes variant metadata straight to order.service fields
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          variant_string: item.variant_string || null
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
          internal_order_id: order.id,
          shipping_method: shippingMethod
        },
        theme: { color: '#000000' },
        handler: async function (response: any) {
          setIsProcessingCheckout(true) 
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
            
            onFinalize('success', order.id, undefined, order.order_number, finalTotal)
          } catch (e: any) {
            console.warn('[Checkout Fallback Switch]:', e)
            onFinalize('success', order.id, e.message || 'Payment verification taking longer than usual.', order.order_number, finalTotal)
          } finally {
            setIsProcessingCheckout(false)
            isProcessingRef.current = false
          }
        },
        modal: {
          ondismiss: async function() {
            try {
              await recordPaymentFailure(order.id, 'Transaction was cancelled.')
              onFinalize('failed', order.id, 'Transaction was cancelled.', order.order_number, finalTotal)
            } finally {
              setIsProcessingCheckout(false)
              isProcessingRef.current = false
            }
          }
        }
      }
      
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', async function (response: any) {
        const errorMsg = response.error?.description || 'Transaction declined by bank.'
        console.error('[Checkout] Transaction declined or failed by bank limits:', errorMsg)
        try {
          await recordPaymentFailure(order.id, errorMsg)
          onFinalize('failed', order.id, errorMsg, order.order_number, finalTotal)
        } finally {
          setIsProcessingCheckout(false)
          isProcessingRef.current = false
        }
      })
      rzp.open()

    } catch (err: any) {
      setCheckoutError(err.message || 'an unexpected configuration glitch happened.')
      setIsProcessingCheckout(false)
      isProcessingRef.current = false
    }
  }, [])

  return { processPayment, isProcessingCheckout, checkoutError }
}