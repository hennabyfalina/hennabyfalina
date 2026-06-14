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
  
  // Prevent double-click and track idempotency signatures
  const isProcessingRef = useRef(false)
  const currentIdempotencyKeyRef = useRef<string | null>(null)

  const processPayment = useCallback(async (payload: CheckoutPayload) => {
    const { user, items, finalTotal, shippingMethod, shippingCost, selectedAddressId, formData, checkoutSessionId } = payload
    
    // Double-click circuit prevention
    if (isProcessingRef.current) {
      console.log('[Checkout] Payment already in progress. Ignoring duplicate call.')
      return
    }
    
    if (!user) {
      console.error('[Checkout] No authorized user found in session profile context')
      setCheckoutError('please log in to continue')
      return
    }
    
    isProcessingRef.current = true
    setIsProcessingCheckout(true)
    setCheckoutError(null)

    // Validate finalTotal before initiating external network pipes
    if (finalTotal <= 0) {
      console.error('[Checkout] Invalid order total transaction value calculation:', finalTotal)
      setCheckoutError('unable to process order. please refresh and try again.')
      isProcessingRef.current = false
      setIsProcessingCheckout(false)
      return
    }

    // Generate clear idempotency keys using item configuration matrix hashes
    const cartSignature = items
      .map(item => `${item.product_id}|${item.quantity}`)
      .sort()
      .join(',')
      
    const baseIdempotencyKey = generateIdempotencyKey('session')
    currentIdempotencyKeyRef.current = baseIdempotencyKey
    
    console.log(`[Checkout] Starting payment sequence with key: ${baseIdempotencyKey}, amount: ₹${finalTotal}`)

    try {
      const addressData: any = { shippingMethod }

      if (shippingMethod === 'delivery') {
        // Enforce UUID structural format validity parameters
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAddressId || '')

        if (!selectedAddressId || !isValidUuid) {
          throw new Error('please select a valid delivery address before placing your order.')
        }
        
        addressData.addressId = selectedAddressId
        console.log('[Checkout] Attaching delivery address ID:', selectedAddressId)
      } else {
        // Home Pickup: store contact info in destination parameters
        addressData.pickupContact = {
          name: formData.name,
          phone: formData.phone,
          pincode: formData.pincode,
        }
        console.log('[Checkout] Attaching home studio pickup contact')
      }

      // 1. Generate core transaction record inside internal backend database tables
      console.log('[Checkout] Creating internal order logs...')
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
      console.log('[Checkout] Order registered successfully:', order.id, order.order_number)
      
      // Wipe frontend application cart stores to lock active state mutations for Step 2 confirmation
      await clearCart()

      // 2. Fetch signed options object back from internal API routing points (Review & Pay trigger)
      console.log('[Checkout] Initializing encrypted backend razorpay session payload...')
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
        let errorMessage = 'failed to initialize secure payment session'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error('[Checkout] Payment initialization error:', errorData)
        } catch (e) {
          const errorText = await response.text()
          console.error('[Checkout] Payment initialization error string:', errorText)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.orderId || !data.keyId) {
        console.error('[Checkout] Invalid properties received from gateway parser:', data)
        throw new Error('invalid payment gateway response. please contact support.')
      }

      // 🔒 GATEWAY SCRIPTS CIRCUIT BREAKER: Avoid script block hang issues
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
          reject(new Error('payment server timeout. network is congested, please retry.'));
        }, GATEWAY_TIMEOUT_MS);
      });

      try {
        await waitForGatewayScript;
      } catch (scriptError: any) {
        throw new Error(scriptError.message);
      }

      // 3. Mount and trigger the secure checkout script overlay interface (Step 2 Finalization)
      console.log('[Checkout] Launching transaction verification checkout frame:', data.orderId)
      
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
        // 🚀 FIXED: Transformed cyan accent into pitch black to integrate seamlessly into our minimalist design theme
        theme: { color: '#000000' },
        handler: async function (response: any) {
          console.log('[Checkout] Transaction signature cleared successfully:', response.razorpay_payment_id)
          
          // ⚡ OPTIMIZATION: Fire eager background validation calls to bypass system webhooks
          try {
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                internal_order_id: order.id
              })
            })
          } catch (e) {
            console.warn('[Checkout] Eager signature check bypassed. Falling back onto global webhook pools.')
          }
          
          window.location.href = `/order/${order.id}?new_order=true`
        },
        modal: {
          ondismiss: function() {
            console.log('[Checkout] Transaction window closed by explicit customer dismiss swipe')
            setIsProcessingCheckout(false)
            isProcessingRef.current = false
            window.location.href = `/profile/orders?filter=failed`
          }
        }
      }
      
      const rzp = new (window as any).Razorpay(options)
      
      rzp.on('payment.failed', function (response: any) {
        console.error('[Checkout] Transaction declined or failed by bank limits:', response.error)
        setIsProcessingCheckout(false)
        isProcessingRef.current = false
        window.location.href = `/profile/orders?filter=failed`
      })
      
      rzp.open()

    } catch (err: any) {
      console.error('[Checkout] Structural workflow execution error:', err)
      setCheckoutError(err.message || 'an unexpected configuration glitch happened.')
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