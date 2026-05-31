'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { calculateTaxBreakdown } from '@/lib/tax'
import { checkoutConfig } from '@/config/checkout'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { showToast } from '@/components/ui/Toast'

// Visual Components
import Container from '@/components/ui/Container'
import Loader from '@/components/ui/Loader'
import CheckoutHeader from '@/components/checkout/CheckoutHeader'
import CheckoutStepCard from '@/components/checkout/CheckoutStepCard'
import CheckoutErrorAlert from '@/components/checkout/CheckoutErrorAlert'
import AddressSelector from '@/components/checkout/AddressSelector'
import AddressFormContainer from '@/components/checkout/AddressFormContainer'
import DeliveryMethod from '@/components/checkout/DeliveryMethod'
import StorePickupInfo from '@/components/checkout/StorePickupInfo'
import OrderSummary from '@/components/checkout/OrderSummary'
import ReviewOrderModal from '@/components/checkout/ReviewOrderModal'
import SecureLoadingOverlay from '@/components/checkout/SecureLoadingOverlay'
import PersistentCheckoutBar from '@/components/checkout/PersistentCheckoutBar'
import CartChangedModal from '@/components/checkout/CartChangedModal'

// Extracted Logic Hooks
import { useCheckoutState } from '@/hooks/useCheckoutState'
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'
import { useCartSignature } from '@/hooks/useCartSignature'

export default function CheckoutPageNew() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const refreshCartPrices = useCartStore((state) => state.refreshCartPrices)

  const [isRefreshingPrices, setIsRefreshingPrices] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // 1. Cart Signature State (For Multi-Tab Sync)
  const { hasCartChanged, setHasCartChanged } = useCartSignature()

  // 2. Checkout & Address State Machine
  const {
    user,
    isInitializing,
    savedAddresses,
    addressMode,
    selectedAddressId,
    formData,
    shippingMethod,
    isSavingAddress,
    addressError,
    canSaveAddress,
    canPlaceOrder,
    setShippingMethod,
    updateFormField,
    startAddingNew,
    startEditing,
    cancelForm,
    saveCurrentAddress,
    handleSelectAddress
  } = useCheckoutState()

  // 🆕 Ref to track if we've already processed the delivery switch
  const deliverySwitchProcessedRef = useRef(false)

  // Force address validation & pre-fill when switching from pickup to delivery
  useEffect(() => {
    if (shippingMethod === 'delivery') {
      const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)
      const isValidForDelivery = selectedAddress && 
        selectedAddress.address_line1 && 
        selectedAddress.city && 
        selectedAddress.state

      if (!isValidForDelivery) {
        const validDeliveryAddresses = savedAddresses.filter(a => a.address_line1 && a.delivery_method === 'delivery')
        
        if (validDeliveryAddresses.length === 0) {
          // 🆕 Only call startAddingNew if we're not already in ADDING mode and not already processed
          if (addressMode !== 'ADDING' && !deliverySwitchProcessedRef.current) {
            deliverySwitchProcessedRef.current = true
            startAddingNew()

            const pickupAddress = savedAddresses.find(a => a.delivery_method === 'pickup')
            if (pickupAddress) {
              updateFormField('name', pickupAddress.name)
              updateFormField('phone', pickupAddress.phone)
              updateFormField('pincode', pickupAddress.pincode)
              updateFormField('addressLine1', '')
              updateFormField('addressLine2', '')
              updateFormField('city', '')
              updateFormField('state', '')
              updateFormField('landmark', '')
              updateFormField('delivery_instructions', '')
            }
          }
        } else {
          const firstValid = validDeliveryAddresses[0]
          if (selectedAddressId !== firstValid.id) {
            handleSelectAddress(firstValid)
          }
        }
      } else {
        // Reset the ref when we have a valid delivery address
        deliverySwitchProcessedRef.current = false
      }
    } else {
      // Reset when switching away from delivery
      deliverySwitchProcessedRef.current = false
    }
  }, [shippingMethod, savedAddresses, selectedAddressId, handleSelectAddress, startAddingNew, updateFormField, addressMode])

  // 🆕 Ref to track if we've already processed the pickup switch
  const pickupSwitchProcessedRef = useRef(false)

  // Auto-select or pre-fill pickup contact when switching to pickup
  useEffect(() => {
    if (shippingMethod === 'pickup') {
      const pickupAddress = savedAddresses.find(a => a.delivery_method === 'pickup')
      
      if (pickupAddress && selectedAddressId !== pickupAddress.id) {
        if (!pickupSwitchProcessedRef.current) {
          pickupSwitchProcessedRef.current = true
          handleSelectAddress(pickupAddress)
        }
      } else if (!pickupAddress) {
        const deliveryAddress = savedAddresses.find(a => a.delivery_method === 'delivery')
        if (deliveryAddress) {
          // Only update fields if we haven't already pre-filled
          if (!pickupSwitchProcessedRef.current) {
            pickupSwitchProcessedRef.current = true
            
            updateFormField('name', deliveryAddress.name)
            updateFormField('phone', deliveryAddress.phone)
            updateFormField('pincode', deliveryAddress.pincode)
            updateFormField('addressLine1', '')
            updateFormField('addressLine2', '')
            updateFormField('city', '')
            updateFormField('state', '')
            updateFormField('landmark', '')
            updateFormField('delivery_instructions', '')
            
            if (addressMode !== 'ADDING') {
              startAddingNew()
              setTimeout(() => {
                updateFormField('name', deliveryAddress.name)
                updateFormField('phone', deliveryAddress.phone)
                updateFormField('pincode', deliveryAddress.pincode)
              }, 0)
            }
          }
        } else if (addressMode !== 'ADDING' && !pickupSwitchProcessedRef.current) {
          pickupSwitchProcessedRef.current = true
          startAddingNew()
        }
      } else {
        // Reset the ref when we have a valid pickup address
        pickupSwitchProcessedRef.current = false
      }
    } else {
      // Reset when switching away from pickup
      pickupSwitchProcessedRef.current = false
    }
  }, [shippingMethod, savedAddresses, selectedAddressId, handleSelectAddress, startAddingNew, addressMode, updateFormField])

  // 3. Razorpay Payment Orchestrator
  const {
    processPayment,
    isProcessingCheckout,
    checkoutError
  } = useRazorpayCheckout()

  const [checkoutSessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('checkout_session_id')
      if (stored) return stored
      const newId = crypto.randomUUID()
      sessionStorage.setItem('checkout_session_id', newId)
      return newId
    }
    return ''
  })

  // Reserve stock when items are loaded
  useEffect(() => {
    if (items.length && checkoutSessionId && user) {
      const reserve = async () => {
        try {
          // Group items by product_id to sum quantities for items with different printing types
          const groupedItems = Object.values(items.reduce((acc, item) => {
            if (!acc[item.product_id]) {
              acc[item.product_id] = { product_id: item.product_id, quantity: 0 }
            }
            acc[item.product_id].quantity += item.quantity
            return acc
          }, {} as Record<string, { product_id: string; quantity: number }>))

          const res = await fetch('/api/checkout/reserve-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: checkoutSessionId,
              items: groupedItems,
            }),
          })
          if (!res.ok) {
            const data = await res.json()
            console.error('Stock reservation failed:', data.error)
            const errorMessage = Array.isArray(data.error)
              ? data.error.join(', ')
              : data.error || 'Stock reservation failed'
            showToast(errorMessage, 'error')
            setTimeout(() => router.push('/cart'), 3000)
          }
        } catch (err) {
          console.error('Reservation error:', err)
          showToast('Unable to reserve stock. Please try again.', 'error')
        }
      }
      reserve()
    }
  }, [items, checkoutSessionId, user, router])

  // Heartbeat: extend reservation every 5 minutes
  useEffect(() => {
    if (!checkoutSessionId) return

    const extendStock = async () => {
      await fetch('/api/checkout/reserve-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: checkoutSessionId, items: [], action: 'extend' }),
      })
    }

    const interval = setInterval(extendStock, 5 * 60 * 1000)
    const handleVisibility = () => { if (document.visibilityState === 'visible') extendStock() }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [checkoutSessionId])

  // Calculate Totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const shippingCost = shippingMethod === 'pickup' ? 0 : (subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
  const finalTotal = subtotal + shippingCost
  const taxBreakdown = calculateTaxBreakdown(subtotal)

  // Sync prices on mount
  useEffect(() => {
    const syncPrices = async () => {
      setIsRefreshingPrices(true)
      try {
        await refreshCartPrices()
      } catch (err) {
        console.error('Failed to refresh prices', err)
      } finally {
        setIsRefreshingPrices(false)
      }
    }
    if (items.length > 0) {
      syncPrices()
    } else {
      setIsRefreshingPrices(false)
    }
  }, [refreshCartPrices, items.length])

  // Redirect if cart is empty after initialization (but NOT if we are processing payment)
  useEffect(() => {
    if (!isRefreshingPrices && !isInitializing && items.length === 0 && !isProcessingCheckout) {
      router.push('/cart')
    }
  }, [items.length, isRefreshingPrices, isInitializing, isProcessingCheckout, router])

  // Initial loading UI
  if (isRefreshingPrices || isInitializing) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center bg-white">
        <Loader />
        <p className="mt-4 text-gray-500 font-medium">Preparing secure checkout...</p>
      </div>
    )
  }

  if (items.length === 0) return null

  // Action Handlers
  const handleInitiateCheckout = () => {
    if (!canPlaceOrder) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (hasCartChanged) {
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmOrder = () => {
    setShowConfirmModal(false)
    processPayment({
      user,
      items,
      finalTotal,
      shippingMethod,
      shippingCost,
      selectedAddressId,
      formData,
      checkoutSessionId,
    })
  }

  const handleReturnToCart = () => {
    router.push('/cart')
  }

  const globalError = checkoutError || addressError

  return (
    <>
      <PersistentCheckoutBar
        subtotal={subtotal}
        shippingCost={shippingCost}
        totalGST={taxBreakdown.totalGST}
        finalTotal={finalTotal}
        totalItems={totalItems}
        shippingMethod={shippingMethod}
        onPlaceOrder={handleInitiateCheckout}
        isProcessing={isProcessingCheckout}
        isSavingAddress={isSavingAddress}
        isAddressFormOpen={addressMode === 'ADDING' || addressMode === 'EDITING'}
      />

      <div className="min-h-screen bg-[#F0F2F2] pb-32 md:pb-40 relative z-0 pt-[61px]">
        <CheckoutHeader />

        <Container className="max-w-[1200px] mt-6 sm:mt-8">
          <CheckoutErrorAlert error={globalError} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
            <div className="lg:col-span-8 space-y-6">
              
              {/* STEP 1: DELIVERY METHOD */}
              <CheckoutStepCard step={checkoutConfig.steps.delivery.number} title={checkoutConfig.steps.delivery.title}>
                <DeliveryMethod shippingMethod={shippingMethod} onChange={setShippingMethod} />
              </CheckoutStepCard>

              {/* STEP 2: ADDRESS */}
              <CheckoutStepCard 
                step={checkoutConfig.steps.address.number} 
                title={shippingMethod === 'pickup' ? checkoutConfig.steps.address.pickupTitle : checkoutConfig.steps.address.shippingTitle}
              >
                {shippingMethod === 'pickup' ? (
                  <div className="space-y-6">
                    {/* Preview mode - show pickup contact selector */}
                    {addressMode === 'PREVIEW' && selectedAddressId ? (
                      <AddressSelector 
                        savedAddresses={savedAddresses}
                        selectedAddressId={selectedAddressId}
                        onSelect={handleSelectAddress}
                        onEdit={startEditing}
                        onAddNew={startAddingNew}
                        showPickup={true}
                      />
                    ) : (
                      /* Add/Edit mode - show form container */
                      <AddressFormContainer
                        formData={formData}
                        updateFormField={updateFormField}
                        shippingMethod={shippingMethod}
                        addressMode={addressMode === 'ADDING' || addressMode === 'EDITING' ? addressMode : 'ADDING'}
                        isSavingAddress={isSavingAddress}
                        canSaveAddress={canSaveAddress}
                        savedAddressesLength={savedAddresses.length}
                        onCancel={cancelForm}
                        onSave={saveCurrentAddress}
                      />
                    )}
                    
                    {/* Store Info Section - always visible */}
                    <StorePickupInfo />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Preview mode - show address selector */}
                    {addressMode === 'PREVIEW' && (
                      <AddressSelector 
                        savedAddresses={savedAddresses}
                        selectedAddressId={selectedAddressId}
                        onSelect={handleSelectAddress}
                        onEdit={startEditing}
                        onAddNew={startAddingNew}
                      />
                    )}
                    
                    {/* Add/Edit mode - show form container */}
                    {(addressMode === 'ADDING' || addressMode === 'EDITING') && (
                      <AddressFormContainer
                        formData={formData}
                        updateFormField={updateFormField}
                        shippingMethod={shippingMethod}
                        addressMode={addressMode === 'ADDING' || addressMode === 'EDITING' ? addressMode : 'ADDING'}
                        isSavingAddress={isSavingAddress}
                        canSaveAddress={canSaveAddress}
                        savedAddressesLength={savedAddresses.length}
                        onCancel={cancelForm}
                        onSave={saveCurrentAddress}
                      />
                    )}
                  </div>
                )}
              </CheckoutStepCard>

              {/* STEP 3: PAYMENT */}
              <CheckoutStepCard step={checkoutConfig.steps.payment.number} title={checkoutConfig.steps.payment.title} isActive={false}>
                <p className="text-lg text-gray-600 pl-11">{checkoutConfig.steps.payment.description}</p>
              </CheckoutStepCard>
            </div>

            {/* RIGHT COLUMN - SUMMARY */}
            <div id="checkout-order-summary" className="lg:col-span-4 lg:sticky lg:top-24 space-y-4 z-20 mb-20 md:mb-0">
              <OrderSummary items={items} subtotal={subtotal} shipping={shippingCost} total={finalTotal} shippingMethod={shippingMethod} />
            </div>
          </div>
        </Container>
      </div>

      {/* MODALS */}
      <CartChangedModal
        isOpen={hasCartChanged}
        onClose={() => setHasCartChanged(false)}
        onReturnToCart={handleReturnToCart}
      />

      <ReviewOrderModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmOrder}
        isProcessing={isProcessingCheckout}
        shippingMethod={shippingMethod}
        formData={formData}
        items={items}
        totalItems={totalItems}
        totalPrice={subtotal}
        shippingCost={shippingCost}
        taxBreakdown={taxBreakdown}
        finalTotal={finalTotal}
      />

      {(isProcessingCheckout || isSavingAddress) && <SecureLoadingOverlay isProcessing={isProcessingCheckout} />}
    </>
  )
}