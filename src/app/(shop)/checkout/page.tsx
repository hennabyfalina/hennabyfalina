// src/app/(shop)/checkout/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { showToast } from '@/components/ui/Toast'
import { Sparkles, Lock, ArrowLeft, ArrowRight, ShieldCheck, MapPin, Home } from 'lucide-react'

// Visual Components
import Container from '@/components/ui/Container'
import Loader from '@/components/ui/Loader'
import CheckoutHeader from '@/components/checkout/CheckoutHeader'
import CheckoutProgressBar from '@/components/checkout/CheckoutProgressBar'
import CheckoutStepCard from '@/components/checkout/CheckoutStepCard'
import CheckoutErrorAlert from '@/components/checkout/CheckoutErrorAlert'
import AddressFormContainer from '@/components/checkout/AddressFormContainer'
import DeliveryMethod from '@/components/checkout/DeliveryMethod'
import StorePickupInfo from '@/components/checkout/StorePickupInfo'
import OrderSummary from '@/components/checkout/OrderSummary'
import PersistentCheckoutBar from '@/components/checkout/PersistentCheckoutBar'
import SessionExpiredModal from '@/components/checkout/SessionExpiredModal'
import CartAlertsModal from '@/components/cart/CartAlertsModal'
import CartChangedModal from '@/components/checkout/CartChangedModal'
import SecureLoadingOverlay from '@/components/checkout/SecureLoadingOverlay'

// Hooks
import { useCheckoutState } from '@/hooks/useCheckoutState'
import { useCheckoutTimer } from '@/hooks/useCheckoutTimer'
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'
import { useCartSignature } from '@/hooks/useCartSignature'
import { formatCurrency } from '@/lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const refreshCartPrices = useCartStore((state) => state.refreshCartPrices)
  const alerts = useCartStore((state) => state.alerts)
  const clearAlerts = useCartStore((state) => state.clearAlerts)

  const [isRefreshingPrices, setIsRefreshingPrices] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  // 1. Cart Signature State (Multi-Tab Session Sync)
  const { hasCartChanged, setHasCartChanged, initialSignature } = useCartSignature()

  // 2. Checkout State Machine
  const {
    user,
    isInitializing,
    savedAddresses,
    currentStep,
    addressMode,
    selectedAddressId,
    formData,
    shippingMethod,
    isSavingAddress,
    addressError,
    isAddressValid,
    canSaveAddress,
    isStepComplete,
    canPlaceOrder,
    nextStep,
    prevStep,
    setShippingMethod,
    updateFormField,
    startAddingNew,
    startEditing,
    cancelForm,
    saveCurrentAddress,
    handleSelectAddress
  } = useCheckoutState()

  // 3. Razorpay Payment Processing Orchestrator
  const { processPayment, isProcessingCheckout, checkoutError } = useRazorpayCheckout()

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

  // 🚀 ANTI-CHEAT: Strict Frontend Reservation Timer 
  const { formattedTime, isExpired, startTimer } = useCheckoutTimer(() => {
    setSessionExpired(true)
  })

  // Stock Reservation Engine
  useEffect(() => {
    if (items.length && checkoutSessionId && user) {
      const reserve = async () => {
        try {
          const res = await fetch('/api/checkout/reserve-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: checkoutSessionId, items }),
          })
          if (!res.ok) {
            const data = await res.json()
            showToast(data.error || 'Batch reservation could not be completed', 'error')
            setTimeout(() => router.push('/cart'), 3000)
          } else {
            // Instantly sync frontend timer upon successful backend reservation lock
            startTimer(15, initialSignature)
          }
        } catch (err) {
          showToast('Unable to reserve selection. Please refresh.', 'error')
        }
      }
      reserve()
    }
  }, [items, checkoutSessionId, user, router])

  // Subtotals & Cost Ledger Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const shippingCost = shippingMethod === 'pickup' ? 0 : (subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
  const finalTotal = subtotal + shippingCost
  const totalMrp = items.reduce((sum, item) => sum + ((item.mrp && item.mrp > item.price) ? item.mrp : item.price) * item.quantity, 0)
  const totalSavings = totalMrp - subtotal

  // 🚀 UX FIX: Gracefully redirect users back to the cart if they land here with an empty bag
  useEffect(() => {
    if (!isInitializing && items.length === 0 && !isProcessingCheckout) {
      router.replace('/cart')
    }
  }, [isInitializing, items.length, isProcessingCheckout, router])

  useEffect(() => {
    const syncPrices = async () => {
      setIsRefreshingPrices(true)
      try { await refreshCartPrices() } catch (err) { console.error(err) }
      finally { setIsRefreshingPrices(false) }
    }
    items.length > 0 ? syncPrices() : setIsRefreshingPrices(false)
  }, [refreshCartPrices, items.length])

  if (isRefreshingPrices || isInitializing) {
    return <div className="flex-1 min-h-[75vh] flex flex-col items-center justify-center bg-white"><Loader /></div>
  }

  if (items.length === 0 && !isProcessingCheckout) return null

  const handleInitiateCheckout = async () => {
    if (!canPlaceOrder) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (hasCartChanged) return

    setIsRefreshingPrices(true)
    await refreshCartPrices()
    setIsRefreshingPrices(false)
    
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

  // 🚀 SMART MORPHING CTA LOGIC
  let ctaText = '';
  let onCtaClick = () => {};
  let isCtaDisabled = false;
  let showCtaSpinner = false;

  if (currentStep === 1) {
    if (addressMode === 'ADDING' || addressMode === 'EDITING') {
      ctaText = 'Save and Continue';
      onCtaClick = saveCurrentAddress;
      isCtaDisabled = !canSaveAddress || isSavingAddress;
      showCtaSpinner = isSavingAddress;
    } else {
      ctaText = 'Continue to Review';
      onCtaClick = nextStep;
      isCtaDisabled = !isStepComplete;
      showCtaSpinner = false;
    }
  } else {
    ctaText = `Securely Pay ${formatCurrency(finalTotal)}`;
    onCtaClick = handleInitiateCheckout;
    isCtaDisabled = isProcessingCheckout;
    showCtaSpinner = isProcessingCheckout;
  }

  return (
    <>
      <SecureLoadingOverlay isProcessing={isProcessingCheckout} />
      <PersistentCheckoutBar
        finalTotal={finalTotal}
        shippingCost={shippingCost}
        buttonText={ctaText}
        onClick={onCtaClick}
        isDisabled={isCtaDisabled}
        isProcessing={showCtaSpinner}
      />

      <div className="min-h-screen bg-white pb-32 md:pb-40 pt-[140px] sm:pt-40 select-none font-sans antialiased text-left">
        <CheckoutHeader />
        
        {/* Step Controller Navigation Subheader Layer */}
        <CheckoutProgressBar currentStep={currentStep} formattedTime={formattedTime} isExpired={isExpired} />
        
        <Container className="max-w-[1400px] px-4 sm:px-8 mt-8">
          <CheckoutErrorAlert error={checkoutError || addressError} />

          {/* 60/40 Flat Asymmetric Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN WORKSPACE: LINEAR STEP FLOW SWITCH FRAME                      */}
            {/* ========================================================================= */}
            <div className="lg:col-span-8 w-full md:min-h-[400px]">
              
              {/* ─── STEP 1: DELIVERY & ADDRESS ─── */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <CheckoutStepCard step={1} title="Delivery Details">
                    <div className="space-y-8">
                      <DeliveryMethod shippingMethod={shippingMethod} onChange={setShippingMethod} />
                      
                      <div className="pt-2 border-t border-gray-100" />
                      
                      <div className="space-y-6">
                        {addressMode === 'PREVIEW' && (
                          <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 sm:p-6 relative animate-fade-in transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-[17px] font-semibold text-gray-900 capitalize">
                                {shippingMethod === 'pickup' ? 'Pickup Contact' : 'Delivery Address'}
                              </h3>
                              <button
                                type="button"
                                onClick={() => startEditing(savedAddresses.find(a => a.id === selectedAddressId))}
                                className="flex items-center gap-1.5 group text-[15px] font-medium text-blue-600 hover:underline decoration-2 underline-offset-4 cursor-pointer">
                                Edit
                              </button>
                            </div>
                            <div className="text-[15px] text-gray-600 font-normal w-full leading-relaxed space-y-1">
                              {shippingMethod === 'pickup' ? (
                                <>
                                  <p className="text-gray-900 font-medium capitalize">{formData.name}</p>
                                  <p className="tracking-wide">{formData.phone}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-gray-900 font-medium capitalize">{formData.name}</p>
                                  <p className="capitalize">{formData.addressLine1}{formData.addressLine2 ? `, ${formData.addressLine2}` : ''}</p>
                                  <p className="capitalize">{formData.city}, {formData.state} {formData.pincode}</p>
                                  <p className="tracking-wide pt-1">{formData.phone}</p>
                                  {formData.landmark && <p className="text-gray-400 mt-2 text-[14px] italic">Landmark: {formData.landmark}</p>}
                                  {formData.delivery_instructions && <p className="text-gray-400 mt-1 text-[14px] italic">Note: {formData.delivery_instructions}</p>}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {(addressMode === 'ADDING' || addressMode === 'EDITING') && (
                          <AddressFormContainer formData={formData} updateFormField={updateFormField} shippingMethod={shippingMethod} addressMode={addressMode} isSavingAddress={isSavingAddress} canSaveAddress={canSaveAddress} savedAddressesLength={savedAddresses.length} onCancel={cancelForm} onSave={saveCurrentAddress} />
                        )}
                      </div>
                    </div>
                  </CheckoutStepCard>

                </div>
              )}

              {/* ─── STEP 2: REVIEW & PAY (FLAT GOOGLE DOCS / APPLE FEEL) ─── */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-fade-in w-full max-w-xl">
                  <div className="bg-white">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                      <h2 className="text-[27px] font-normal text-gray-900 tracking-tight capitalize">Review & Pay</h2>
                      <button 
                        type="button" 
                        onClick={() => { const currentAddr = savedAddresses.find(a => a.id === selectedAddressId); if (currentAddr) { startEditing(currentAddr); } else { startAddingNew(); } prevStep(); }} 
                        className="flex items-center gap-1.5 group text-[15px] font-medium text-blue-600 hover:underline decoration-2 underline-offset-4 cursor-pointer">
                        Edit Details
                      </button>
                    </div>
                    
                    {/* Linear Borderless Information Summary Strip */}
                    <div className="text-[15px] text-gray-600 font-normal w-full leading-relaxed space-y-1">
                      {shippingMethod === 'pickup' ? (
                        <>
                          <p className="text-gray-900 font-semibold text-[16px] capitalize pb-1">Pickup by: {formData.name}</p>
                          <p className="tracking-wide">Phone: {formData.phone}</p>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100" />                          
                          <StorePickupInfo />
                        </>
                      ) : (
                        <>
                          <p className="text-gray-900 font-semibold text-[16px] capitalize pb-1">Name: {formData.name}</p>
                          <p className="capitalize"> Address: {formData.addressLine1}{formData.addressLine2 ? `, ${formData.addressLine2}` : ''}</p>
                          <p className="capitalize">{formData.city}, {formData.state} {formData.pincode}</p>
                          <p className="tracking-wide pt-1">Phone: {formData.phone}</p>
                          {formData.landmark && (
                            <p className="text-gray-400 mt-2 text-[14px] italic">Landmark: {formData.landmark}</p>
                          )}
                          {formData.delivery_instructions && (
                            <p className="text-gray-400 mt-2 text-[14px] italic">Note: {formData.delivery_instructions}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN WORKSPACE: SECURE TRANSACTION SUMMARY IMMUTABLE LEDGER     */}
            {/* ========================================================================= */}
            <div className="lg:col-span-4 lg:sticky lg:top-40 flex flex-col gap-6 w-full">
              
              <OrderSummary 
                items={items} 
                subtotal={subtotal} 
                shipping={shippingCost} 
                total={finalTotal} 
                shippingMethod={shippingMethod}
                ctaText={ctaText}
                onCtaClick={onCtaClick}
                isCtaDisabled={isCtaDisabled}
                showCtaSpinner={showCtaSpinner}
              />
              
              {/* Secure Trust Validation Footnote anchor line */}
              <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-gray-400 pt-2 capitalize">
                <ShieldCheck className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                <span>100% Secure Checkout</span>
              </div>
            </div>

          </div>
        </Container>
      </div>
      
      <CartChangedModal isOpen={hasCartChanged} onClose={() => setHasCartChanged(false)} onReturnToCart={() => router.push('/cart')} />
      <CartAlertsModal alerts={alerts} onDismiss={clearAlerts} />
      
      <SessionExpiredModal isOpen={sessionExpired} onClose={() => {
        setSessionExpired(false);
        router.push('/cart');
      }} />
    </>
  )
}