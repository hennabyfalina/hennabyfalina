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
import Loader from '@/components/ui/Loader'
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import { formatCurrency, numberToIndianWords } from '@/lib/utils'
import { AddressFormData } from '@/components/checkout/AddressForm'
import { Lock, ChevronLeft, X, AlertTriangle, Package, MapPin, Store, ShieldCheck } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  
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

  useEffect(() => {
    const verifyAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/checkout')
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
    setIsProcessing(true) // 🚨 Triggers the new Blur Overlay
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

      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: finalTotal,
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

      // 🚨 Programmatic Navigation happens here!
      router.push(`/checkout/processing?order_id=${order.id}&amount=${razorpayData.amount}&rzp_order=${razorpayData.orderId}`)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to initialize payment')
      setIsProcessing(false) // Removes the blur if it fails
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Checkout</h1>
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

            <button
              onClick={handleOpenConfirmModal}
              disabled={!isFormValid || items.length === 0 || isProcessing}
              className="w-full py-3 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none"
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
                    className="w-full px-4 py-2 text-sm font-medium text-[#0F1111] bg-white border border-[#D5D9D9] hover:bg-gray-50 rounded-sm shadow-sm transition-colors"
                  >
                    Yes, Return to Cart
                  </button>
                  <button
                    onClick={() => setShowCartWarningModal(false)}
                    className="w-full px-4 py-2 text-sm font-bold text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-colors"
                  >
                    Stay in Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 DETAILED REVIEW ORDER MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#F0F2F2] rounded-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between p-4 bg-white border-b border-[#D5D9D9] shrink-0">
                <h3 className="text-xl font-bold text-[#0F1111]">Review Your Order</h3>
                <button onClick={handleCloseModal} disabled={isProcessing} className="p-1 hover:bg-gray-100 rounded-sm transition-colors disabled:opacity-50">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                
                <div className="bg-white border border-[#D5D9D9] p-3 rounded-sm flex items-center justify-between">
                  <span className="font-bold text-[#0F1111]">Delivery Method</span>
                  <span className="text-[#007185] font-bold flex items-center gap-1.5">
                    {shippingMethod === 'pickup' ? <Store className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {shippingMethod === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
                  </span>
                </div>

                <div className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-[#D5D9D9] font-bold text-[#0F1111]">
                    {shippingMethod === 'pickup' ? 'Pickup Details' : 'Shipping Address'}
                  </div>
                  <div className="p-4 text-sm text-[#0F1111] space-y-3">
                    {shippingMethod === 'pickup' ? (
                      <>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                          <span className="text-gray-500 font-medium">Name:</span>
                          <span>{formData.name}</span>
                          <span className="text-gray-500 font-medium">Phone:</span>
                          <span>{formData.phone}</span>
                          <span className="text-gray-500 font-medium">Pincode:</span>
                          <span>{formData.pincode}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#D5D9D9]">
                          <p className="font-bold mb-1 text-[#007185]">{siteConfig.name}</p>
                          <p>{siteConfig.address.line1}, {siteConfig.address.line2}</p>
                          <p>{siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}</p>
                          <p className="mt-1"><span className="text-gray-500 font-medium">Phone: </span>{siteConfig.contact.phone.primary}, {siteConfig.contact.phone.secondary}</p>
                          <p className="mt-1"><span className="text-gray-500 font-medium">Hours: </span>{siteConfig.business.workingHours}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                          <span className="text-gray-500 font-medium">Name:</span>
                          <span>{formData.name}</span>
                          <span className="text-gray-500 font-medium">Phone:</span>
                          <span>{formData.phone}</span>
                          <span className="text-gray-500 font-medium">Address:</span>
                          <span>
                            {formData.addressLine1}
                            {formData.addressLine2 && <>, {formData.addressLine2}</>}
                            <br/>{formData.city}, {formData.state} - {formData.pincode}
                          </span>
                        </div>
                        {(formData.landmark || formData.delivery_instructions) && (
                          <div className="mt-3 pt-3 border-t border-[#D5D9D9] grid grid-cols-[100px_1fr] gap-2">
                            {formData.landmark && (
                              <>
                                <span className="text-gray-500 font-medium">Landmark:</span>
                                <span>{formData.landmark}</span>
                              </>
                            )}
                            {formData.delivery_instructions && (
                              <>
                                <span className="text-gray-500 font-medium">Instructions:</span>
                                <span>{formData.delivery_instructions}</span>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-[#D5D9D9] font-bold text-[#0F1111] flex justify-between">
                    <span>Order Items</span>
                    <span className="font-normal text-sm">{totalItems} items</span>
                  </div>
                  <div className="p-0 divide-y divide-[#D5D9D9] max-h-48 overflow-y-auto">
                    {items.map((item: any, idx) => {
                      const isBulkApplied = item.bulk_price && item.bulk_min_quantity && item.quantity >= item.bulk_min_quantity;
                      return (
                        <div key={idx} className="p-3 flex justify-between items-start gap-4 text-sm">
                          <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium text-[#0F1111] line-clamp-2">{item.name || 'Product'}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-gray-500">Qty: {item.quantity}</span>
                                {isBulkApplied && (
                                  <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-sm">
                                    Bulk Price
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-[#0F1111] whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  
                  {hasBulkDiscount && (
                    <div className="bg-green-50 px-4 py-2 border-t border-[#D5D9D9] text-xs text-green-800 font-medium flex items-center justify-center">
                      Wholesale discounts applied
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
                  <div className="p-4 space-y-1.5 text-sm text-[#0F1111]">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t border-[#D5D9D9] text-[#B12704]">
                      <span>Order Total:</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="p-4 bg-white border-t border-[#D5D9D9] shrink-0 flex flex-col sm:flex-row justify-end gap-3 rounded-b-sm relative">
                <button
                  onClick={handleCloseModal}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-sm font-bold text-[#0F1111] bg-gray-100 border border-[#D5D9D9] rounded-sm hover:bg-gray-200 transition-colors disabled:opacity-50 sm:w-auto w-full"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleProceedToPaymentGateway}
                  disabled={isProcessing}
                  className="px-8 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-50 shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none flex items-center justify-center gap-2 sm:w-auto w-full relative overflow-hidden"
                >
                  {isProcessing ? 'Securing Order...' : 'Confirm & Pay'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 🚨 FULL-SCREEN BLUR SECURE LOADING OVERLAY 🚨 */}
        {isProcessing && showConfirmModal && (
          <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-sm shadow-2xl flex flex-col items-center border border-[#D5D9D9] max-w-sm w-full text-center">
              <div className="w-14 h-14 border-4 border-[#007185]/20 border-t-[#007185] rounded-full animate-spin mb-5"></div>
              <h3 className="text-xl font-bold text-[#0F1111] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Securing Your Order
              </h3>
              <p className="text-sm text-[#565959] leading-relaxed">
                Please wait while we transfer you to our secure payment gateway. Do not close this window.
              </p>
            </div>
          </div>
        )}

      </Container>
    </div>
  )
}