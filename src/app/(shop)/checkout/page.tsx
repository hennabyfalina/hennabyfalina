// src/app/(shop)/checkout/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { createOrder, saveAddress, getSavedAddresses } from '@/services/order.service'
import { createClient } from '@/lib/supabase/client'
import Container from '@/components/ui/Container'
import AddressForm from '@/components/checkout/AddressForm'
import DeliveryMethod from '@/components/checkout/DeliveryMethod'
import StorePickupInfo from '@/components/checkout/StorePickupInfo'
import OrderSummary from '@/components/checkout/OrderSummary'
import ReviewOrderModal from '@/components/checkout/ReviewOrderModal'
import SecureLoadingOverlay from '@/components/checkout/SecureLoadingOverlay'
import Loader from '@/components/ui/Loader'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { AddressFormData } from '@/components/checkout/AddressForm'
import { Lock, ChevronLeft, X, AlertTriangle, Package, MapPin, Store, ShieldCheck, ExternalLink } from 'lucide-react'
import { siteConfig } from '@/config/site'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/supabase/storage'

// 🚨 B2B & Tax Imports
import { B2B_CONSTANTS, PRINTING_TIERS } from '@/config/b2b-rules'
import { calculateTaxBreakdown } from '@/lib/tax'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  
  const [mounted, setMounted] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false) 
  const [showCartWarningModal, setShowCartWarningModal] = useState(false) 
  const [userId, setUserId] = useState<string | null>(null)
  const [isFormLoaded, setIsFormLoaded] = useState(false)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isShippingMethodLoaded, setIsShippingMethodLoaded] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN')
  const [isNavigatingToCart, setIsNavigatingToCart] = useState(false)
  
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery')

  const [formData, setFormData] = useState<AddressFormData>({
    name: '', phone: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', pincode: '', delivery_instructions: ''
  })

  // Dynamic check: Did ANY item in the cart qualify for a bulk discount?
  const hasBulkDiscount = items.some((item: any) => 
    item.bulk_price && item.bulk_min_quantity && item.quantity >= item.bulk_min_quantity
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keep a fresh reference to the modal state so the popstate listener sees the current value
  const showConfirmModalRef = useRef(showConfirmModal)
  useEffect(() => {
    showConfirmModalRef.current = showConfirmModal
  }, [showConfirmModal])

  // 🚨 SMART INTERCEPT: Catch Browser Back Button & Swipe Gestures
  useEffect(() => {
    if (!mounted || isAuthChecking || isProcessing || isNavigatingToCart) return

    if (!window.history.state?.checkoutTrap) {
      window.history.pushState({ checkoutTrap: true }, '', window.location.href)
    }

    const handlePopState = () => {
      window.history.pushState({ checkoutTrap: true }, '', window.location.href)
      
      if (showConfirmModalRef.current) {
        setShowConfirmModal(false)
      } else {
        setShowCartWarningModal(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [mounted, isAuthChecking, isProcessing, isNavigatingToCart])

  const handleClearAddressForm = () => {
    setFormData({
      name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', landmark: '', delivery_instructions: ''
    })
    setIsPhoneValid(true)
    setSelectedCountryCode('IN')
    if (userId) {
      localStorage.removeItem(`checkout_form_${userId}`)
      localStorage.removeItem(`checkout_shipping_method_${userId}`)
    }
  }

  const handleReturnToCartClick = () => {
    setShowCartWarningModal(true)
  }

  const confirmReturnToCart = () => {
    setShowCartWarningModal(false)
    setIsNavigatingToCart(true)
    setTimeout(() => {
      router.push('/cart')
    }, 200)
  }

  const safeTrim = (val?: string | null) => (val || '').trim()
  
  const isContactValid = safeTrim(formData.name).length > 0 && safeTrim(formData.phone).length > 0 && isPhoneValid
  const isPincodeValid = /^\d{6}$/.test((formData.pincode || '').replace(/\D/g, ''))
  const isAddressValid = 
    safeTrim(formData.addressLine1).length > 0 &&
    safeTrim(formData.addressLine2).length > 0 &&
    safeTrim(formData.city).length > 0 &&
    safeTrim(formData.state).length > 0 &&
    isPincodeValid

  const isFormValid = shippingMethod === 'pickup'
    ? (isContactValid && isPincodeValid)
    : (isContactValid && isAddressValid)

  const shippingCost = shippingMethod === 'pickup' ? 0 : (totalPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
  const finalTotal = totalPrice + shippingCost
  
  // 🚨 Calculate Enterprise Tax Breakdown for the Order Summary
  const taxBreakdown = calculateTaxBreakdown(totalPrice)

  useEffect(() => {
    const verifyAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?next=/checkout')
        return
      }
      setUserId(session.user.id)
      setIsAuthChecking(false)
    }
    verifyAuth()
  }, [router])

  useEffect(() => {
    if (userId) {
      const savedForm = localStorage.getItem(`checkout_form_${userId}`)
      const savedShippingMethod = localStorage.getItem(`checkout_shipping_method_${userId}`)

      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm)
          setFormData(prev => ({ ...prev, ...parsed }))
        } catch (err) {}
      }
      if (savedShippingMethod) {
        setShippingMethod(savedShippingMethod as 'delivery' | 'pickup')
      }
      setIsFormLoaded(true)
      setIsShippingMethodLoaded(true)
    }
  }, [userId])

  useEffect(() => {
    if (isFormLoaded && userId && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`checkout_form_${userId}`, JSON.stringify(formData))
      }, 500) 
      return () => clearTimeout(timeoutId)
    }
  }, [formData, isFormLoaded, userId])

  useEffect(() => {
    if (isShippingMethodLoaded && userId && shippingMethod) {
      localStorage.setItem(`checkout_shipping_method_${userId}`, shippingMethod)
    }
  }, [shippingMethod, isShippingMethodLoaded, userId])

  useEffect(() => {
    if (items.length === 0 && !isProcessing && !isAuthChecking) {
      router.push('/cart')
    }
    if (!isAuthChecking) {
      loadSavedAddresses()
    }
  }, [items.length, router, isProcessing, isAuthChecking])

  const loadSavedAddresses = async () => {
    const addresses = await getSavedAddresses()
    setSavedAddresses(addresses)
  }

  const handleFormChange = (field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhoneValidation = (isValid: boolean) => {
    setIsPhoneValid(isValid)
  }

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode)
  }

  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true)
  }

  const handleCloseModal = () => {
    setShowConfirmModal(false)
    setIsProcessing(false)
  }

  const handleProceedToPaymentGateway = async () => {
  setIsProcessing(true)
  try {
    let addressToSave;
    if (shippingMethod === 'pickup') {
      addressToSave = {
        name: formData.name,
        phone: formData.phone,
        pincode: formData.pincode,
        country: selectedCountryCode === 'IN' ? 'India' : selectedCountryCode,
        delivery_method: 'pickup'
      }
    } else {
      addressToSave = {
        name: formData.name,
        phone: formData.phone,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2,
        landmark: formData.landmark,
        delivery_instructions: formData.delivery_instructions,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: selectedCountryCode === 'IN' ? 'India' : selectedCountryCode,
        delivery_method: 'delivery'
      }
    }

    const savedAddress = await saveAddress(addressToSave)

    const orderItems = items.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      printing_type: item.printing_type || 'None',
      artwork_urls: item.artwork_urls || [],
      artwork_sizes: item.artwork_sizes || [],
      printing_instructions: item.printing_instructions || null
    }))

    const { order, orderNumber } = await createOrder({
      addressId: savedAddress.id,
      items: orderItems,
      totalAmount: finalTotal,
      paymentMethod: 'razorpay',
      shippingMethod,
      shippingCost,
    })

    // ✅ FIX: Remove 'amount' from request – server fetches from DB
    const response = await fetch('/api/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId: order.id,
        orderNumber: orderNumber,
        userId: userId
      }),
    })

    const razorpayData = await response.json()
    if (razorpayData.error) throw new Error(razorpayData.error)

    clearCart()
    if (userId) {
      localStorage.removeItem(`checkout_form_${userId}`)
      localStorage.removeItem(`checkout_shipping_method_${userId}`)
    }

    router.push(`/checkout/processing?order_id=${encodeURIComponent(order.id)}&amount=${encodeURIComponent(razorpayData.amount)}&rzp_order=${encodeURIComponent(razorpayData.orderId)}`)
  } catch (err: any) {
    console.error(err)
    alert(err.message || 'Failed to initialize payment')
    setIsProcessing(false)
    setShowConfirmModal(false)
  }
}

  if (isAuthChecking) {
    return (
      <Container className="flex-1 min-h-[80vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader />
          <p className="text-sm font-medium text-gray-600 mt-4">Verifying session securely...</p>
        </div>
      </Container>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F2] flex flex-col">
      <header className="py-4 border-b border-white/10 bg-black shadow-sm sticky top-0 z-50">
        <Container>
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white cursor-default">
              {siteConfig.name}
            </span>
            <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="hidden sm:inline">Secure Checkout</span>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-6 md:py-10 pb-12 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-4">Checkout</h1>
          <div className="bg-white p-4 rounded-sm border border-[#D5D9D9] shadow-sm flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#0F1111] mb-1">Your transaction is secure</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your security is our priority. We use Razorpay to encrypt your payment information and never share your details with third parties. <Link href="/privacy" target="_blank" className="text-[#007185] hover:text-[#C7511F] hover:underline">Learn more</Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative items-start">
          <div className="lg:col-span-7 space-y-4">
            
            <DeliveryMethod
              shippingMethod={shippingMethod}
              onChange={setShippingMethod}
              disabled={isProcessing}
            />

            {savedAddresses.length > 0 && (
              <div className="bg-white border border-[#D5D9D9] p-4 rounded-sm shadow-sm flex flex-col gap-2">
                <label htmlFor="saved-address-select" className="text-sm font-bold text-[#0F1111] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Use a saved address
                </label>
                <select
                  id="saved-address-select"
                  disabled={isProcessing}
                  onChange={(e) => {
                    const address = savedAddresses.find(a => a.id === e.target.value)
                    if (address) {
                      setFormData({
                        name: address.name || '',
                        phone: address.phone || '',
                        addressLine1: address.address_line1 || '',
                        addressLine2: address.address_line2 || '',
                        landmark: address.landmark || '',
                        city: address.city || '',
                        state: address.state || '',
                        pincode: address.pincode || '',
                        delivery_instructions: address.delivery_instructions || ''
                      })
                    }
                  }}
                  className="w-full px-3 py-2.5 sm:py-3 bg-white border border-[#D5D9D9] rounded-sm text-[15px] text-[#0F1111] focus:outline-none focus:border-[#FF9900] cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="">Select a saved address...</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.name} - {addr.address_line1}, {addr.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {shippingMethod === 'pickup' && <StorePickupInfo />}
            
            <AddressForm
              formData={formData}
              onChange={handleFormChange}
              onPhoneValidationChange={handlePhoneValidation}
              onCountryChange={handleCountryChange}
              shippingMethod={shippingMethod}
              disabled={isProcessing}
              onClear={handleClearAddressForm}
            />
          </div>

          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <OrderSummary
              items={items}
              subtotal={totalPrice}
              shipping={shippingCost}
              total={finalTotal}
              shippingMethod={shippingMethod}
            />
            
            <button
              onClick={handleReturnToCartClick}
              disabled={isNavigatingToCart || isProcessing}
              className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] hover:underline transition-colors duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isNavigatingToCart ? (
                <>
                  <div className="w-3 h-3 border-2 border-[#007185] border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-3 h-3" />
                  Return to cart
                </>
              )}
            </button>

            <button
              onClick={handleOpenConfirmModal}
              disabled={!isFormValid || items.length === 0 || isProcessing}
              className="w-full py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none cursor-pointer"
            >
              Review Order and Pay
            </button>

            <div className="bg-white border border-[#D5D9D9] rounded-sm p-3">
              <div className="flex justify-between items-start py-1">
                <div className="flex flex-col items-center text-center gap-1 w-1/3 px-1">
                  <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/icon-returns._CB484059092_.png" alt="Returns" className="w-7 h-7 object-contain" />
                  <span className="text-[11px] text-[#007185] leading-tight">7 days Replacement</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1 w-1/3 px-1">
                  <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/icon-amazon-delivered._CB485933725_.png" alt="Delivery" className="w-7 h-7 object-contain" />
                  <span className="text-[11px] text-[#007185] leading-tight">Secure Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1 w-1/3 px-1">
                  <img src="https://m.media-amazon.com/images/G/31/A2I-Convert/mobile/IconFarm/Secure-payment._CB650126890_.png" alt="Secure" className="w-7 h-7 object-contain" />
                  <span className="text-[11px] text-[#007185] leading-tight">Secure Transaction</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-xs text-[#007185] pt-2">
              <Link href="/privacy" target="_blank" className="hover:text-[#C7511F] hover:underline">Privacy Policy</Link>
              <Link href="/contact" target="_blank" className="hover:text-[#C7511F] hover:underline">Contact Us</Link>
              <Link href="/support" target="_blank" className="hover:text-[#C7511F] hover:underline">Support</Link>
            </div>
          </div>
        </div>

        {/* 🚨 RETURN TO CART WARNING MODAL */}
        {showCartWarningModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white rounded-sm shadow-2xl animate-in zoom-in-95 duration-200 border border-[#D5D9D9]">
              <div className="p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-yellow-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1111] mb-2">Return to Cart?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to go back? You can review your items, but you will need to confirm your checkout details again.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={confirmReturnToCart}
                    className="w-full px-4 py-2 text-sm font-medium text-[#0F1111] bg-white border border-[#D5D9D9] hover:bg-gray-50 rounded-sm shadow-sm transition-colors cursor-pointer"
                  >
                    Yes, Return to Cart
                  </button>
                  <button
                    onClick={() => setShowCartWarningModal(false)}
                    className="w-full px-4 py-2 text-sm font-bold text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-colors cursor-pointer"
                  >
                    Stay in Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 DETAILED REVIEW ORDER MODAL */}
        <ReviewOrderModal
          isOpen={showConfirmModal}
          onClose={handleCloseModal}
          onConfirm={handleProceedToPaymentGateway}
          isProcessing={isProcessing}
          shippingMethod={shippingMethod}
          formData={formData}
          items={items}
          totalItems={totalItems}
          totalPrice={totalPrice}
          shippingCost={shippingCost}
          taxBreakdown={taxBreakdown}
          finalTotal={finalTotal}
          hasBulkDiscount={hasBulkDiscount}
        />

        {/* 🚨 BANK-GRADE INSTANT TRANSITION OVERLAY 🚨 */}
        <SecureLoadingOverlay isProcessing={isProcessing} />

      </Container>
    </div>
  )
}