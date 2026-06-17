// src/hooks/useCheckoutState.ts

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSavedAddresses, saveAddress, updateAddress } from '@/services/order.service'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import type { AddressFormData } from '@/components/checkout/AddressForm'
import { showToast } from '@/components/ui/Toast'

export type AddressMode = 'LOADING' | 'PREVIEW' | 'ADDING' | 'EDITING'
export type ShippingMethod = 'delivery' | 'pickup'
export type CheckoutStep = 1 | 2 | 3

const INITIAL_FORM_DATA: AddressFormData = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  delivery_instructions: '',
  fullName: ''
}

export function useCheckoutState() {
  const router = useRouter()
  const clearCart = useCartStore((state) => state.clearCart)
  
  // Core Data States
  const [user, setUser] = useState<any>(null)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Step Workflow Tracker
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1)
  
  // Address Field Workspaces
  const [addressMode, setAddressMode] = useState<AddressMode>('LOADING')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('delivery')
  
  // Terminal Step 3 Result Workspaces
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null)
  const [completedOrderAmount, setCompletedOrderAmount] = useState<number | null>(null)
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null)

  // Progress Operational Status Flags
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  // Maps addresses into our localized state fields
  const handleSelectAddress = useCallback((address: any) => {
    setSelectedAddressId(address.id)
    const mappedData = {
      name: address.name,
      phone: address.phone,
      addressLine1: address.address_line1 || '',
      addressLine2: address.address_line2 || '', 
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      delivery_instructions: address.delivery_instructions || '',
      delivery_method: address.delivery_method,
      fullName: address.name || '',
    }
    setFormData(mappedData)
    setAddressMode('PREVIEW')
    setAddressError(null)
  }, [])

  // INITIALIZATION ENGINE: Validates Supabase token context & hydrates address records
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true)
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login?next=/checkout')
          return
        }
        setUser(session.user)

        // 🚀 ENTERPRISE SECURITY: Hard Redirect on Step 3 Refresh Attempts
        const savedSessionStep = sessionStorage.getItem('checkout_step')
        if (savedSessionStep === '3') {
           const status = sessionStorage.getItem('checkout_status') as 'success' | 'failed'
           const orderId = sessionStorage.getItem('checkout_order_id')
           
           sessionStorage.removeItem('checkout_step')
           if (status === 'success' && orderId) {
             router.replace(`/order/${orderId}?new_order=true`)
             return 
           } else if (status === 'failed') {
             router.replace('/cart')
             return 
           }
        }
        
        // Clear partials safely if no direct hit
        sessionStorage.removeItem('checkout_step')
        sessionStorage.removeItem('checkout_status')
        sessionStorage.removeItem('checkout_order_id')

        const addresses = await getSavedAddresses()
        setSavedAddresses(addresses)
        
        const recentTempAddress = addresses.find(a => a.is_temp)
        const permanentAddresses = addresses.filter(a => !a.is_temp)

        if (recentTempAddress) {
          handleSelectAddress(recentTempAddress)
          setShippingMethod(recentTempAddress.delivery_method || 'delivery')
        } else if (permanentAddresses.length > 0) {
          const defaultAddress = permanentAddresses.find(a => a.is_default) || permanentAddresses[0]
          handleSelectAddress(defaultAddress)
        } else {
          setAddressMode('ADDING')
        }
      } catch (err) {
        console.error('failed to hydrate secure profile logs:', err)
        setAddressError('failed to initialize secure checkout connection.')
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [router, handleSelectAddress])

  // Step Workflow Navigation Rails
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev === 1) return 2
      return prev
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev === 2) return 1
      return prev
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const startAddingNew = useCallback(() => {
    if (addressMode === 'ADDING') return
    setSelectedAddressId(null)
    // 🚀 LIQUID MEMORY: Preserve user name and phone inputs when resetting address form
    setFormData(prev => ({ ...INITIAL_FORM_DATA, name: prev.name, phone: prev.phone, fullName: prev.fullName }))
    setAddressMode('ADDING')
    setAddressError(null)
  }, [addressMode])

  const startEditing = useCallback((address: any) => {
    handleSelectAddress(address)
    setAddressMode('EDITING')
  }, [handleSelectAddress])

  const cancelForm = useCallback(() => {
    const permanentAddresses = savedAddresses.filter(a => 
      a.id !== null && !a.is_temp && a.delivery_method === shippingMethod
    )
    
    if (permanentAddresses.length > 0) {
      const defaultAddress = permanentAddresses.find(a => a.is_default) || permanentAddresses[0]
      handleSelectAddress(defaultAddress)
    } else {
      setAddressMode('ADDING')
      setSelectedAddressId(null)
      // 🚀 LIQUID MEMORY: Preserve user name and phone inputs when canceling form
      setFormData(prev => ({ ...INITIAL_FORM_DATA, name: prev.name, phone: prev.phone, fullName: prev.fullName }))
    }
  }, [savedAddresses, shippingMethod, handleSelectAddress])

  const updateFormField = useCallback((field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Verification Computed Computations
  const isAddressValid = useMemo(() => {
    if (shippingMethod === 'pickup') {
      const { name, phone } = formData
      const isPhoneValid = /^\d{10}$/.test(phone.toString().replace(/[^0-9]/g, '').slice(-10))
      return !!(name && isPhoneValid)
    }
    
    const { name, phone, addressLine1, city, state, pincode } = formData
    const isPhoneValid = /^\d{10}$/.test(phone.toString().replace(/[^0-9]/g, '').slice(-10))
    const isPinValid = /^\d{6}$/.test(pincode)
    return !!(name && isPhoneValid && addressLine1 && city && state && isPinValid)
  }, [formData, shippingMethod])

  const canSaveAddress = useMemo(() => {
    return isAddressValid
  }, [isAddressValid])

  // Validates if the selected step configuration parameters are satisfied
  const isStepComplete = useMemo(() => {
    if (currentStep === 1) {
      if (shippingMethod === 'pickup') return isAddressValid
      
      if (addressMode === 'PREVIEW') {
        if (selectedAddressId) {
          const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)
          return !!(selectedAddress?.name && selectedAddress?.phone && 
                    selectedAddress?.address_line1 && selectedAddress?.city && 
                    selectedAddress?.state && selectedAddress?.pincode)
        }
        return isAddressValid
      }
      return false // Form is currently open in ADDING/EDITING mode, user needs to save first
    }
    
    return true // Step 2 represents final checkout gateway evaluation state
  }, [currentStep, shippingMethod, addressMode, selectedAddressId, savedAddresses, isAddressValid])

  const canPlaceOrder = useMemo(() => {
    if (shippingMethod === 'pickup') return isAddressValid
    
    if (selectedAddressId) {
      const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)
      return !!(selectedAddress?.name && selectedAddress?.phone && 
                selectedAddress?.address_line1 && selectedAddress?.city && 
                selectedAddress?.state && selectedAddress?.pincode)
    }
    return isAddressValid
  }, [shippingMethod, selectedAddressId, savedAddresses, isAddressValid])

  // Saves address details and advances to Step 3
  const saveCurrentAddress = useCallback(async () => {
    if (!canSaveAddress) return
    setIsSavingAddress(true)
    setAddressError(null)

    try {
      const addressPayload = {
        name: formData.name,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        delivery_instructions: formData.delivery_instructions || '',
        delivery_method: shippingMethod,
        is_temp: true,
        is_default: false,
      }

      let savedAddress: any;
      if (addressMode === 'EDITING' && selectedAddressId) {
        savedAddress = await updateAddress(selectedAddressId, addressPayload)
        setSavedAddresses(prev => prev.map(addr => addr.id === selectedAddressId ? savedAddress : addr))
      } else {
        // 🚀 DATABASE ANTI-POLLUTION: Check for an existing temp active-cart address first
        const existingTempAddress = savedAddresses.find(a => a.is_temp);
        if (existingTempAddress) {
          // ALWAYS UPSERT existing temp row to keep DB clean
          savedAddress = await updateAddress(existingTempAddress.id, addressPayload);
          setSavedAddresses(prev => prev.map(addr => addr.id === existingTempAddress.id ? savedAddress : addr));
        } else {
          savedAddress = await saveAddress(addressPayload);
          setSavedAddresses(prev => [savedAddress, ...prev]);
        }
      }

      if (savedAddress) {
        handleSelectAddress(savedAddress)
      }
      setAddressMode('PREVIEW')
      
      // 🚀 CONVERSION BOOSTER: Instantly push them to Step 2 (Review & Pay) once details are successfully locked
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // 🚀 MICRO-INTERACTION: Affirmative feedback on explicit user save
      showToast(
        shippingMethod === 'pickup' 
          ? 'Pickup details saved' 
          : 'Delivery details saved', 
        'success'
      )
    } catch (error: any) {
      console.error('failed to save details to database context:', error)
      setAddressError(error.message || 'failed to save credentials securely.')
    } finally {
      setIsSavingAddress(false)
    }
  }, [canSaveAddress, addressMode, formData, shippingMethod, selectedAddressId, handleSelectAddress])

  const clearSavedAddress = useCallback(() => {
    // Database lifecycle cron handles cleanups
  }, [])

  // Terminal Transition Controller
  const finalizeCheckout = useCallback((status: 'success' | 'failed', orderId?: string, errorMsg?: string, orderNumber?: string, orderAmount?: number) => {
    if (status === 'success') {
      clearCart()
    }
    setCheckoutStatus(status)
    if (orderId) {
      setCompletedOrderId(orderId)
      sessionStorage.setItem('checkout_order_id', orderId)
    }
    if (orderNumber) {
      setCompletedOrderNumber(orderNumber)
      sessionStorage.setItem('checkout_order_number', orderNumber)
    }
    if (errorMsg) setPaymentErrorMessage(errorMsg)
    if (orderAmount !== undefined) {
      setCompletedOrderAmount(orderAmount)
      sessionStorage.setItem('checkout_order_amount', orderAmount.toString())
    }
    setCurrentStep(3)
    sessionStorage.setItem('checkout_step', '3')
    sessionStorage.setItem('checkout_status', status)
  }, [clearCart])

  return {
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
    setShippingMethod: (method: ShippingMethod) => {
      if (method !== shippingMethod) {
        setShippingMethod(method)
        setAddressError(null)
        
        // 🚀 LIQUID MEMORY: Fluid mode transition without losing typed data
        const { name, phone, addressLine1, city, state, pincode } = formData
        const isPhoneValid = /^\d{10}$/.test(phone.toString().replace(/[^0-9]/g, '').slice(-10))
        const isPinValid = /^\d{6}$/.test(pincode)
        
        const isNewMethodValid = method === 'pickup' 
          ? !!(name && isPhoneValid)
          : !!(name && isPhoneValid && addressLine1 && city && state && isPinValid)

        if (addressMode === 'PREVIEW') {
          const currentAddr = savedAddresses.find(a => a.id === selectedAddressId)
          if (currentAddr?.is_temp) {
            if (isNewMethodValid) {
              setAddressMode('PREVIEW')
            } else {
              setAddressMode('EDITING')
            }
          } else {
            const newModeAddrs = savedAddresses.filter(a => !a.is_temp && a.delivery_method === method)
            if (newModeAddrs.length > 0) {
              const defaultAddress = newModeAddrs.find(a => a.is_default) || newModeAddrs[0]
              handleSelectAddress(defaultAddress)
            } else {
              setAddressMode('ADDING')
              setSelectedAddressId(null)
              setFormData(prev => ({ ...INITIAL_FORM_DATA, name: prev.name, phone: prev.phone, fullName: prev.fullName }))
            }
          }
        }
      }
    },
    updateFormField,
    startAddingNew,
    startEditing,
    cancelForm,
    saveCurrentAddress,
    handleSelectAddress,
    setAddressError,
    clearSavedAddress,
  }
}