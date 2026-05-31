// src/hooks/useCheckoutState.ts

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSavedAddresses, saveAddress, updateAddress } from '@/services/order.service'
import { useRouter } from 'next/navigation'
import type { AddressFormData } from '@/components/checkout/AddressForm'

export type AddressMode = 'LOADING' | 'PREVIEW' | 'ADDING' | 'EDITING'
export type ShippingMethod = 'delivery' | 'pickup'

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
  
  const [user, setUser] = useState<any>(null)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [addressMode, setAddressMode] = useState<AddressMode>('LOADING')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [initialFormData, setInitialFormData] = useState(INITIAL_FORM_DATA)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('delivery')
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

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
    setInitialFormData(mappedData)
    setAddressMode('PREVIEW')
    setAddressError(null)
  }, [])

  // INITIALIZATION: Fetch user & addresses
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
        console.error('Failed to load user/addresses:', err)
        setAddressError('Failed to initialize secure checkout.')
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [router, handleSelectAddress])

  const startAddingNew = useCallback(() => {
    if (addressMode === 'ADDING') return
    setSelectedAddressId(null)
    setFormData(INITIAL_FORM_DATA)
    setInitialFormData(INITIAL_FORM_DATA)
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
      setFormData(INITIAL_FORM_DATA)
      setInitialFormData(INITIAL_FORM_DATA)
    }
  }, [savedAddresses, shippingMethod, handleSelectAddress])

  const updateFormField = useCallback((field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const isFormDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData)
  }, [formData, initialFormData])

  const isAddressValid = useMemo(() => {
    if (shippingMethod === 'pickup') {
      const { name, phone, pincode } = formData
      const isPhoneValid = /^\d{10}$/.test(phone.toString().replace(/[^0-9]/g, '').slice(-10))
      const isPinValid = /^\d{6}$/.test(pincode)
      return !!(name && isPhoneValid && isPinValid)
    }
    
    const { name, phone, addressLine1, city, state, pincode } = formData
    const isPhoneValid = /^\d{10}$/.test(phone.toString().replace(/[^0-9]/g, '').slice(-10))
    const isPinValid = /^\d{6}$/.test(pincode)
    return !!(name && isPhoneValid && addressLine1 && city && state && isPinValid)
  }, [formData, shippingMethod])

  const canSaveAddress = useMemo(() => {
    if (!isAddressValid) return false
    if (addressMode === 'EDITING' && !isFormDirty) return false
    return true
  }, [isAddressValid, addressMode, isFormDirty])

  const canPlaceOrder = useMemo(() => {
    if (shippingMethod === 'pickup') {
      return isAddressValid
    }

    if (addressMode === 'PREVIEW') {
      if (selectedAddressId) {
        const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)
        return !!(selectedAddress?.name && selectedAddress?.phone && 
                  selectedAddress?.address_line1 && selectedAddress?.city && 
                  selectedAddress?.state && selectedAddress?.pincode)
      } else {
        return isAddressValid
      }
    }
    return false
  }, [shippingMethod, addressMode, selectedAddressId, savedAddresses, isAddressValid])

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
        delivery_instructions: formData.delivery_instructions,
        delivery_method: shippingMethod,
        is_temp: true,
        is_default: false,
      }

      let savedAddress: any;
      if (addressMode === 'ADDING') {
        savedAddress = await saveAddress(addressPayload)
        setSavedAddresses(prev => [savedAddress, ...prev])
      } else if (addressMode === 'EDITING' && selectedAddressId) {
        savedAddress = await updateAddress(selectedAddressId, addressPayload)
        setSavedAddresses(prev => prev.map(addr => addr.id === selectedAddressId ? savedAddress : addr))
      }

      if (savedAddress) {
        handleSelectAddress(savedAddress)
      }
      setAddressMode('PREVIEW')
    } catch (error: any) {
      console.error('Failed to save address:', error)
      setAddressError(error.message || 'Failed to save address securely.')
    } finally {
      setIsSavingAddress(false)
    }
  }, [canSaveAddress, addressMode, formData, shippingMethod, selectedAddressId, handleSelectAddress])

  const clearSavedAddress = useCallback(() => {
    // No longer required, cleanup handled via database cron job
  }, [])

  return {
    user,
    isInitializing,
    savedAddresses,
    addressMode,
    selectedAddressId,
    formData,
    shippingMethod,
    isSavingAddress,
    addressError,
    isAddressValid,
    canSaveAddress,
    canPlaceOrder,
    setShippingMethod,
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