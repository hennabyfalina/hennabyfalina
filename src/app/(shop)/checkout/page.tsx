// src/app/(shop)/checkout/page.tsx

'use client'

import { useState, useEffect } from 'react'
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
import PaymentButton from '@/components/checkout/PaymentButton'
import Loader from '@/components/ui/Loader'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { AddressFormData } from '@/components/checkout/AddressForm'
import { showToast } from '@/components/ui/Toast'
import { Lock, ChevronLeft, ArrowRight, X, Check } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isFormLoaded, setIsFormLoaded] = useState(false)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isShippingMethodLoaded, setIsShippingMethodLoaded] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN')
  const [isNavigatingToCart, setIsNavigatingToCart] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
  
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery')

  const [formData, setFormData] = useState<AddressFormData>({
    name: '', phone: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', pincode: '', delivery_instructions: ''
  })

  // Clear all form fields
  const handleClearAddressForm = () => {
    setFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      delivery_instructions: ''
    })
    setIsPhoneValid(true)
    setSelectedCountryCode('IN')
    if (userId) {
      // Clear saved form data and shipping method from local storage
      localStorage.removeItem(`checkout_form_${userId}`)
      localStorage.removeItem(`checkout_shipping_method_${userId}`)
    }
  }

  // Smooth navigation to cart
  const handleReturnToCart = () => {
    setIsNavigatingToCart(true)
    setTimeout(() => {
      router.push('/cart')
    }, 200)
  }

  // Validation
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

  useEffect(() => {
    const verifyAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/checkout')
        return
      }
      // Set userId and load saved data from local storage
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
        } catch (err) {
          console.error('Failed to parse saved form data from local storage', err)
        }
      }
      if (savedShippingMethod) {
        setShippingMethod(savedShippingMethod as 'delivery' | 'pickup')
      }
      setIsFormLoaded(true)
      setIsShippingMethodLoaded(true)
    }
  }, [userId])

  useEffect(() => {
    // PERFORMANCE: Debounce disk writes to prevent UI input lag on mobile devices
    if (isFormLoaded && userId && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`checkout_form_${userId}`, JSON.stringify(formData))
      }, 500) // Only save after 500ms of typing inactivity
      
      return () => clearTimeout(timeoutId)
    }
  }, [formData, isFormLoaded, userId]) // Depend on formData, isFormLoaded, userId

  useEffect(() => {
    // Save shipping method to local storage whenever it changes
    if (isShippingMethodLoaded && userId && shippingMethod) {
      localStorage.setItem(`checkout_shipping_method_${userId}`, shippingMethod)
    }
  }, [shippingMethod, isShippingMethodLoaded, userId]) // Depend on shippingMethod, isShippingMethodLoaded, userId

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

  const handleInitiatePayment = async () => {
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

      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }))

      const { order, orderNumber } = await createOrder({
        addressId: savedAddress.id,
        items: orderItems,
        totalAmount: finalTotal,
        paymentMethod: 'razorpay',
        shippingMethod,
        shippingCost,
      })

      return { orderId: order.id, orderNumber: orderNumber, amount: finalTotal }
    } catch (err: any) {
      setIsProcessing(false)
      throw new Error(err.message || 'Failed to initialize order details')
    }
  }

  const handlePaymentSuccess = (orderId?: string) => {
    clearCart()
    if (userId) {
      localStorage.removeItem(`checkout_form_${userId}`)
      localStorage.removeItem(`checkout_shipping_method_${userId}`)
    }
    setPaymentStatus('success')
    setPaymentMessage('Payment successful! Thank you for your order.')
    setTimeout(() => {
      if(orderId) {
        router.push(`/order/${orderId}`)
      } else {
        router.push(`/profile/orders`)
      }
    }, 1000)
  }

  const handlePaymentFailure = (errorMsg: string) => {
    setPaymentStatus('failed')
    setPaymentMessage(errorMsg || 'Payment failed. Please try again.')
    setTimeout(() => {
      router.push('/profile/orders?filter=failed')
    }, 1500)
  }

  const handleProceedToPayment = () => {
    setShowConfirmModal(true)
  }

  const handleCloseModal = () => {
    setShowConfirmModal(false)
    setIsProcessing(false)
  }

  // Auth loader
  if (isAuthChecking) {
    return (
      <Container className="py-16 md:py-24 text-center min-h-[60vh] flex flex-col justify-center">
        <Loader />
        <p className="text-gray-600 text-sm font-medium mt-4">Verifying session securely...</p>
      </Container>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F2] flex flex-col">
      {/* Header */}
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Checkout</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Delivery Method Component */}
            <DeliveryMethod
              shippingMethod={shippingMethod}
              onChange={setShippingMethod}
              disabled={isProcessing}
            />

            {/* Saved Addresses (only for delivery) */}
            {savedAddresses.length > 0 && shippingMethod === 'delivery' && (
              <div className="bg-white border border-[#D5D9D9] p-4 rounded-sm shadow-sm flex flex-col gap-2">
                <label htmlFor="saved-address-select" className="text-sm font-bold text-[#0F1111] flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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
                  className="w-full px-3 py-2 bg-white border border-[#D5D9D9] rounded-sm text-sm text-[#0F1111] focus:outline-none focus:border-[#FF9900]"
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
            
            {/* Store Pickup Info (only for pickup) */}
            {shippingMethod === 'pickup' && <StorePickupInfo />}
            
            {/* Address Form */}
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

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* Order Summary */}
            <OrderSummary
              items={items}
              subtotal={totalPrice}
              shipping={shippingCost}
              total={finalTotal}
              shippingMethod={shippingMethod}
            />
            
            {/* Smooth Return to Cart button */}
            <button
              onClick={handleReturnToCart}
              disabled={isNavigatingToCart}
              className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] hover:underline transition-colors duration-200 disabled:opacity-50"
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

            {/* Payment Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={!isFormValid || items.length === 0 || isProcessing}
              className="w-full py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none"
            >
              Place Order and Pay
            </button>

            {/* Amazon-style Trust Badges */}
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

            {/* Footer links */}
            <div className="flex justify-center gap-4 text-xs text-[#007185] pt-2">
              <Link href="/privacy" target="_blank" className="hover:text-[#C7511F] hover:underline">Privacy Policy</Link>
              <Link href="/contact" target="_blank" className="hover:text-[#C7511F] hover:underline">Contact Us</Link>
              <Link href="/support" target="_blank" className="hover:text-[#C7511F] hover:underline">Support</Link>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
{showConfirmModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="relative w-full max-w-lg bg-white rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between p-5 border-b border-[#D5D9D9]">
        <h3 className="text-lg font-bold text-[#0F1111]">Confirm Your Order</h3>
            <button onClick={handleCloseModal} disabled={isProcessing} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        {shippingMethod === 'pickup' ? (
          <>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Pickup Contact</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p><span className="font-medium text-gray-900">Name:</span> {formData.name}</p>
                <p><span className="font-medium text-gray-900">Mobile:</span> {formData.phone}</p>
                <p><span className="font-medium text-gray-900">Pincode:</span> {formData.pincode}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Store Location</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-medium text-gray-900">{siteConfig.name}</p>
                <p>
                  {siteConfig.address.line1},<br />
                  {siteConfig.address.city} - {siteConfig.address.pincode},<br />
                  {siteConfig.address.state}, {siteConfig.address.country}
                </p>
                <p><span className="font-medium text-gray-900">Hour: </span>{siteConfig.business.workingHours}</p>
                <p><span className="font-medium text-gray-900">Phone: </span>{siteConfig.contact.phone.primary}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">Delivery Address</p>
              <div className="text-sm text-gray-700">
                <p><span className="font-medium text-gray-900">Name:</span> {formData.name}</p>
                <p><span className="font-medium text-gray-900">Mobile:</span> {formData.phone}</p>
                
                  <span className="font-medium text-gray-900">Address:</span> {formData.addressLine1}
                  {formData.addressLine2 && <>, {formData.addressLine2}</>}
                
                <p>
                  {formData.city}, {formData.state} - {formData.pincode}
                </p>
              </div>
            </div>

            {/* Other Details - Only show landmark and instructions */}
            {(formData.landmark || formData.delivery_instructions) && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Other Details</p>
                <div className="text-sm text-gray-700">
                  {formData.landmark && (
                    <p><span className="font-medium text-gray-900">Landmark:</span> {formData.landmark}</p>
                  )}
                  {formData.delivery_instructions && (
                    <p><span className="font-medium text-gray-900">Instructions:</span> {formData.delivery_instructions}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">Order Summary</p>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Items ({totalItems}):</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-[#D5D9D9] mt-2">
              <span>Total:</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-[#D5D9D9] bg-gray-50 rounded-b-sm">
        <button
              onClick={handleCloseModal}
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-medium text-[#0F1111] bg-white border border-[#D5D9D9] rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Edit
        </button>
        <div className="flex-1 max-w-[200px]">
          <PaymentButton
            onInitiate={handleInitiatePayment}
            onSuccess={(orderId) => {
              setShowConfirmModal(false)
              handlePaymentSuccess(orderId)
            }}
            onFailure={(msg) => {
              setShowConfirmModal(false)
              handlePaymentFailure(msg)
            }}
            disabled={isProcessing}
            amount={finalTotal}
          />
        </div>
      </div>
    </div>
  </div>
)}

        {/* Payment Status Overlay */}
        {paymentStatus !== 'idle' && (
          <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center p-4 bg-white animate-in fade-in duration-200">
            {paymentStatus === 'success' ? (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 delay-150">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Order Placed!</h2>
                <p className="text-lg text-gray-600 font-medium text-center max-w-md mb-8">{paymentMessage}</p>
                <div className="flex items-center gap-3 text-sm text-green-700 font-bold bg-green-50 px-4 py-2 rounded-full">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  Redirecting to your order...
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 delay-150">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <X className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Payment Failed</h2>
                <p className="text-lg text-gray-600 font-medium text-center max-w-md mb-8">{paymentMessage}</p>
                <div className="flex items-center gap-3 text-sm text-red-700 font-bold bg-red-50 px-4 py-2 rounded-full">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Redirecting to failed orders...
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}