// src/hooks/useRazorpayCheckout.ts

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createOrder } from '@/services/order.service'
import { useCartStore } from '@/store/cart.store'
import { useProductDraftStore } from '@/store/productDraft.store'
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
  
  // Prevent double-click and track idempotency
  const isProcessingRef = useRef(false)
  const currentIdempotencyKeyRef = useRef<string | null>(null)

  const processPayment = useCallback(async (payload: CheckoutPayload) => {
    const { user, items, finalTotal, shippingMethod, shippingCost, selectedAddressId, formData, checkoutSessionId } = payload
    
    // Double-click prevention
    if (isProcessingRef.current) {
      console.log('[Checkout] Payment already in progress. Ignoring duplicate call.')
      return
    }
    
    if (!user) {
      console.error('[Checkout] No user found')
      setCheckoutError('Please log in to continue')
      return
    }
    
    isProcessingRef.current = true
    setIsProcessingCheckout(true)
    setCheckoutError(null)

    // 🆕 Validate finalTotal before proceeding
    if (finalTotal <= 0) {
      console.error('[Checkout] Invalid order amount:', finalTotal)
      setCheckoutError('Unable to process order. Please refresh and try again.')
      isProcessingRef.current = false
      setIsProcessingCheckout(false)
      return
    }

    // Generate unique idempotency key
    const cartSignature = items
      .map(item => `${item.product_id}|${item.printing_type}|${item.quantity}`)
      .sort()
      .join(',')
    const baseIdempotencyKey = generateIdempotencyKey('session')
    currentIdempotencyKeyRef.current = baseIdempotencyKey
    
    console.log(`[Checkout] Starting payment with base idempotency key: ${baseIdempotencyKey}, amount: ₹${finalTotal}`)

    try {
      const addressData: any = { shippingMethod }

      if (shippingMethod === 'delivery') {
        // Check if selectedAddressId is a valid UUID (existing address)
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAddressId || '')

        if (!selectedAddressId || !isValidUuid) {
          throw new Error('Please select a valid delivery address before placing the order.')
        }
        
        addressData.addressId = selectedAddressId
        console.log('[Checkout] Using delivery address ID:', selectedAddressId)
      } else {
        // Pickup: store contact info in order's pickup_contact column
        addressData.pickupContact = {
          name: formData.name,
          phone: formData.phone,
          pincode: formData.pincode,
        }
        console.log('[Checkout] Using pickup contact')
      }

      // 1. Create Internal Order in DB with address/pickup data
      console.log('[Checkout] Creating order...')
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          printing_type: item.printing_type,
          artwork_urls: item.artwork_urls,
          artwork_sizes: item.artwork_sizes,
          printing_instructions: item.printing_instructions,
          price: 0,
          is_temp: true 
        })),
        totalAmount: 0,
        shippingCost: 0,
        paymentMethod: 'razorpay',
        shippingMethod,
        sessionId: checkoutSessionId,
        idempotencyKey: `${baseIdempotencyKey}_order`,
        addressData,
      }

      // our custom verification tracking fields safely if your type signature supports metadata properties:
      const completePayload = {
        ...orderData,
        expected_total_for_logging: finalTotal,
        client_shipping_cost: shippingCost
      }

      const order = await createOrder(orderData)
      console.log('[Checkout] Order created:', order.id, order.order_number)
      
      // Clear drafts and cart after order is created
      items.forEach(item => {
        useProductDraftStore.getState().clearDraft(item.product_id)
      })
      await clearCart()

      // 2. Initialize Razorpay
      console.log('[Checkout] Initializing Razorpay payment...')
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

      // 🆕 Better error handling for API response
      if (!response.ok) {
        let errorMessage = 'Failed to initialize payment gateway'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error('[Checkout] Payment API error:', errorData)
        } catch (e) {
          const errorText = await response.text()
          console.error('[Checkout] Payment API error (non-JSON):', errorText)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('[Checkout] Razorpay API response:', { 
        hasOrderId: !!data.orderId, 
        hasKeyId: !!data.keyId,
        amount: data.amount,
        existing: data.existing
      })
      
      if (!data.orderId || !data.keyId) {
        console.error('[Checkout] Invalid Razorpay response:', data)
        throw new Error('Invalid payment configuration received from server.')
      }

      // 🔒 GATEWAY CIRCUIT BREAKER: Enforce strict execution timeouts
      const GATEWAY_TIMEOUT_MS = 8000;
      const waitForGatewayScript = new Promise((resolve, reject) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const interval = setInterval(() => {
          if ((window as any).Razorpay) {
            clearInterval(interval);
            resolve(true);
          }
        }, 250);
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Gateway connectivity timeout exceeded.'));
        }, GATEWAY_TIMEOUT_MS);
      });

      try {
        await waitForGatewayScript;
      } catch (scriptError: any) {
        throw new Error('Payment network is currently congested. Please try again or choose an alternative option.');
      }

      // 3. Open Razorpay Checkout Modal
      console.log('[Checkout] Opening Razorpay modal for order:', data.orderId)
      
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
        theme: { color: '#007185' },
        handler: async function (response: any) {
          console.log('[Checkout] Payment successful:', response.razorpay_payment_id)
          window.location.href = `/order/${order.id}?new_order=true`
        },
        modal: {
          ondismiss: function() {
            console.log('[Checkout] Payment modal dismissed by user')
            window.location.href = `/profile/orders?filter=failed`
          }
        }
      }
      
      const rzp = new (window as any).Razorpay(options)
      
      rzp.on('payment.failed', function (response: any) {
        console.error('[Checkout] Payment failed:', response.error)
        window.location.href = `/profile/orders?filter=failed`
      })
      
      rzp.open()

    } catch (err: any) {
      console.error('[Checkout] Error:', err)
      setCheckoutError(err.message || 'An unexpected error occurred during checkout.')
      setIsProcessingCheckout(false)
      isProcessingRef.current = false
    }
  }, [clearCart])

  const resetProcessing = useCallback(() => {
    isProcessingRef.current = false
    setIsProcessingCheckout(false)
    setCheckoutError(null)
  }, [])

  return { 
    processPayment, 
    isProcessingCheckout, 
    checkoutError, 
    setIsProcessingCheckout,
    resetProcessing
  }
}