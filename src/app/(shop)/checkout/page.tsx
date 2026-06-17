// src/app/(shop)/checkout/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { showToast } from '@/components/ui/Toast'
import { Sparkles, Lock, ArrowLeft, ArrowRight, ShieldCheck, MapPin, Home, CheckCircle, AlertTriangle } from 'lucide-react'

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
import confetti from 'canvas-confetti'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const refreshCartPrices = useCartStore((state) => state.refreshCartPrices)
  const alerts = useCartStore((state) => state.alerts)
  const clearAlerts = useCartStore((state) => state.clearAlerts)

  const [isRefreshingPrices, setIsRefreshingPrices] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

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
    checkoutStatus,
    completedOrderId,
    completedOrderNumber,
    completedOrderAmount,
    paymentErrorMessage,
    finalizeCheckout,
    setCurrentStep,
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

  const clearCheckoutSession = () => {
    sessionStorage.removeItem('checkout_step')
    sessionStorage.removeItem('checkout_status')
    sessionStorage.removeItem('checkout_order_id')
    sessionStorage.removeItem('checkout_order_number')
    sessionStorage.removeItem('checkout_order_amount')
  }

  // 🚀 ANTI-CHEAT: Strict Frontend Reservation Timer 
  const { formattedTime, isExpired, startTimer, stopTimer } = useCheckoutTimer(() => {
    setSessionExpired(true)
  })

  // Kill timer & hide modal gracefully when finalizing checkout successfully
  useEffect(() => {
    if (currentStep === 3) {
      stopTimer()
      setSessionExpired(false)
    }
  }, [currentStep, stopTimer])

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
  }, [items, checkoutSessionId, user, router, startTimer, initialSignature])

  // 🚀 ENTERPRISE SECURITY: Step 3 Terminal Protections & Auto-Redirects
  useEffect(() => {
    if (currentStep === 3) {
      // 1. Initiate correct countdown length
      setRedirectCountdown(checkoutStatus === 'success' ? 10 : 60)
      
      // 2. SPA Trapping: Push a dummy history state to intercept physical back buttons
      window.history.pushState(null, '', window.location.href)
      const handlePopState = () => {
        clearCheckoutSession()
        if (checkoutStatus === 'success') {
          router.replace(`/order/${completedOrderId}?new_order=true`)
        } else {
          router.replace('/cart')
        }
      }
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [currentStep, checkoutStatus, completedOrderId, router])

  // 🚀 Process the countdown ticker
  useEffect(() => {
    if (currentStep === 3 && redirectCountdown !== null) {
      if (redirectCountdown > 0) {
        const timer = setInterval(() => setRedirectCountdown(prev => prev! - 1), 1000)
        return () => clearInterval(timer)
      } else {
        clearCheckoutSession()
        if (checkoutStatus === 'success') {
          router.replace(`/order/${completedOrderId}?new_order=true`)
        } else {
          router.replace('/cart')
        }
      }
    }
  }, [currentStep, redirectCountdown, checkoutStatus, completedOrderId, router])

  // Subtotals & Cost Ledger Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const shippingCost = shippingMethod === 'pickup' ? 0 : (subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
  const finalTotal = subtotal + shippingCost
  const totalMrp = items.reduce((sum, item) => {
    const baselinePrice = Number(item.mrp) || Number(item.original_price) || Number(item.price);
    return sum + (baselinePrice * item.quantity);
  }, 0)
  const totalSavings = totalMrp - subtotal

  // 🚀 UX FIX: Gracefully redirect users back to the cart if they land here with an empty bag
  useEffect(() => {
    if (!isInitializing && items.length === 0 && !isProcessingCheckout && currentStep < 3) {
      router.replace('/cart')
    }
  }, [isInitializing, items.length, isProcessingCheckout, router, currentStep])

  useEffect(() => {
    const syncPrices = async () => {
      setIsRefreshingPrices(true)
      try { await refreshCartPrices() } catch (err) { console.error(err) }
      finally { setIsRefreshingPrices(false) }
    }
    items.length > 0 ? syncPrices() : setIsRefreshingPrices(false)
  }, [refreshCartPrices, items.length])

  const handleInitiateCheckout = async () => {
    if (!canPlaceOrder) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (hasCartChanged) {
      setHasCartChanged(true);
      return;
    }

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
      onFinalize: finalizeCheckout
    })
  }

  // 🚀 SMART MORPHING CTA LOGIC
  let ctaText = '';
  let onCtaClick = () => {};
  let isCtaDisabled = false;
  let showCtaSpinner = false;
  let secondaryCtaText = '';
  let onSecondaryCtaClick = () => {};

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
  } else if (currentStep === 2) {
    ctaText = `Securely Pay ${formatCurrency(finalTotal)}`;
    onCtaClick = handleInitiateCheckout;
    isCtaDisabled = isProcessingCheckout;
    showCtaSpinner = isProcessingCheckout;
  } else if (currentStep === 3) {
    if (checkoutStatus === 'success') {
      ctaText = 'View Order';
      onCtaClick = () => { clearCheckoutSession(); router.replace(`/order/${completedOrderId}?new_order=true`); };
      secondaryCtaText = 'Shopping';
      onSecondaryCtaClick = () => { clearCheckoutSession(); router.replace('/products'); };
    } else {
      ctaText = 'Retry Payment';
      onCtaClick = handleInitiateCheckout;
      isCtaDisabled = isProcessingCheckout;
      showCtaSpinner = isProcessingCheckout;
      secondaryCtaText = 'Cancel';
      onSecondaryCtaClick = () => { clearCheckoutSession(); router.replace('/products'); };
    }
  }

  // 🚀 DELIGHTFUL UX: Fire Confetti on Successful Payment
  useEffect(() => {
    if (currentStep === 3 && checkoutStatus === 'success') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 },
        colors: ['#10B981', '#3B82F6', '#059669']
      })
    }
  }, [currentStep, checkoutStatus])

  if (isRefreshingPrices || isInitializing) {
    return <div className="flex-1 min-h-[75vh] flex flex-col items-center justify-center bg-white"><Loader /></div>
  }

  if (items.length === 0 && !isProcessingCheckout && currentStep < 3) return null

  return (
    <>
      <SecureLoadingOverlay isProcessing={isProcessingCheckout} />
      <PersistentCheckoutBar
        currentStep={currentStep}
        checkoutStatus={checkoutStatus}
        finalTotal={finalTotal}
        shippingCost={shippingCost}
        buttonText={ctaText}
        onClick={onCtaClick}
        isDisabled={isCtaDisabled}
        isProcessing={showCtaSpinner}
        secondaryButtonText={secondaryCtaText}
        onSecondaryClick={onSecondaryCtaClick}
      />

      <div className="min-h-screen bg-white pb-32 md:pb-40 pt-[140px] sm:pt-40 select-none font-sans antialiased text-left">
        <CheckoutHeader currentStep={currentStep} formattedTime={formattedTime} isExpired={isExpired} />
        
        {/* Step Controller Navigation Subheader Layer */}
        <CheckoutProgressBar currentStep={currentStep} checkoutStatus={checkoutStatus} />
        
        <Container className="max-w-[1400px] px-4 sm:px-8 mt-8">
          <CheckoutErrorAlert error={checkoutError || addressError} />

          {/* 60/40 Flat Asymmetric Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN WORKSPACE: LINEAR STEP FLOW SWITCH FRAME                      */}
            {/* ========================================================================= */}
            <div className={`w-full ${currentStep === 3 ? 'lg:col-span-12' : 'lg:col-span-8 md:min-h-[400px]'}`}>
              
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

              {/* ─── STEP 3: TERMINAL (SUCCESS / FAILURE) ─── */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-fade-in w-full max-w-2xl mx-auto text-center py-4 md:py-8 mt-4">
                  {checkoutStatus === 'success' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                        <CheckCircle className="w-10 h-10" strokeWidth={2} />
                      </div>
                      <h2 className="text-[28px] font-normal tracking-tight text-gray-900 mb-2">Thank you, {formData.name.split(' ')[0]}!</h2>
                      <p className="text-[16px] text-gray-500 mb-8">Your order has been confirmed.</p>
                      
                      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 w-full text-left mb-8 space-y-3">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="text-gray-500 text-[14px]">Order Number</span>
                          <span className="text-gray-900 font-medium tracking-wide">{completedOrderNumber || completedOrderId?.split('-')[0].toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="text-gray-500 text-[14px]">Total Amount</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(completedOrderAmount ?? finalTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-[14px]">Delivery Method</span>
                          <span className="text-gray-900 font-medium capitalize">{shippingMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}</span>
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-row items-center gap-3 w-full mb-3">
                        <button onClick={() => { clearCheckoutSession(); router.replace(`/order/${completedOrderId}?new_order=true`); }} className="w-full sm:flex-1 h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[14px] font-medium transition-all shadow-none cursor-pointer border-none outline-none">
                          View Order
                        </button>
                        <button onClick={() => { clearCheckoutSession(); router.replace('/products'); }} className="w-full sm:flex-1 h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl text-[14px] font-medium transition-all shadow-none cursor-pointer outline-none whitespace-nowrap">
                          Shopping
                        </button>
                      </div>
                      
                      <p className="text-[13px] text-gray-400 italic">Redirecting to order details in {redirectCountdown} seconds...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 border border-red-100">
                        <AlertTriangle className="w-10 h-10" strokeWidth={2} />
                      </div>
                      <h2 className="text-[28px] font-normal tracking-tight text-gray-900 mb-2">Payment Incomplete</h2>
                      <p className="text-[15px] text-gray-600 mb-2">{paymentErrorMessage || 'Transaction was declined or cancelled.'}</p>
                      <p className="text-[14px] text-gray-400 mb-8">Don&apos;t worry, your cart is safe and stock is still reserved.</p>

                      <div className="hidden sm:flex flex-row items-center gap-3 w-full mb-3">
                        <button onClick={handleInitiateCheckout} disabled={isProcessingCheckout} className="w-full sm:flex-1 h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[14px] font-medium transition-all flex items-center justify-center shadow-none cursor-pointer border-none outline-none">
                          {isProcessingCheckout ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Retry Payment'}
                        </button>
                        <button onClick={() => { clearCheckoutSession(); router.replace('/products'); }} className="w-full sm:flex-1 h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl text-[14px] font-medium transition-all shadow-none cursor-pointer outline-none">
                          Cancel
                        </button>
                      </div>
                      
                      {!isProcessingCheckout && <p className="text-[13px] text-gray-400 italic">Complete the payment with in {redirectCountdown} seconds...</p>}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN WORKSPACE: SECURE TRANSACTION SUMMARY IMMUTABLE LEDGER     */}
            {/* ========================================================================= */}
            {currentStep < 3 && (
              <div className="lg:col-span-4 lg:sticky lg:top-40 flex flex-col gap-6 w-full">
                
                <OrderSummary 
                  items={items as any} 
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
            )}

          </div>
        </Container>
      </div>
      
      <CartChangedModal isOpen={hasCartChanged} onClose={() => setHasCartChanged(false)} onReturnToCart={() => router.push('/cart')} />
      <CartAlertsModal alerts={alerts} onDismiss={clearAlerts} />
      
      <SessionExpiredModal isOpen={sessionExpired && currentStep < 3} onClose={() => {
        setSessionExpired(false);
        router.push('/cart');
      }} />
    </>
  )
}
