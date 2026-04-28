// src/components/checkout/AddressForm.tsx

'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import PhoneInput from '@/components/ui/PhoneInput'
import { INDIAN_STATES } from '@/lib/states' // 🚨 Clean Reusable Import

export interface AddressFormData {
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  landmark: string
  delivery_instructions: string
}

interface AddressFormProps {
  formData: AddressFormData
  onChange: (field: keyof AddressFormData, value: string) => void
  onPhoneValidationChange?: (isValid: boolean) => void
  onCountryChange?: (countryCode: string) => void
  shippingMethod: 'delivery' | 'pickup'
  disabled?: boolean
  onClear?: () => void
}

export default function AddressForm({
  formData,
  onChange,
  onPhoneValidationChange,
  onCountryChange,
  shippingMethod,
  disabled = false,
  onClear,
}: AddressFormProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputClass = "w-full px-3 py-2 bg-white border border-[#D5D9D9] rounded-sm focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] transition-shadow text-sm placeholder:text-[#565959] disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
  const errorInputClass = "w-full px-3 py-2 bg-white border border-red-500 rounded-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-shadow text-sm placeholder:text-[#565959] disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm"
  const labelClass = "block text-sm font-bold text-[#0F1111] mb-1"
  const errorClass = "text-xs text-red-600 mt-1 font-medium"

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 100) return 'Name is too long'
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) return 'Name can only contain letters'
    return ''
  }

  const validateAddressLine1 = (address: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!address.trim()) return 'Address is required'
    if (address.trim().length < 2) return 'Address must be at least 2 characters'
    return ''
  }

  const validateAddressLine2 = (address: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!address.trim()) return 'Area, Street, Sector, Village is required'
    if (address.trim().length < 3) return 'Must be at least 3 characters'
    return ''
  }

  const validateCity = (city: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!city.trim()) return 'City is required'
    if (city.trim().length < 2) return 'City must be at least 2 characters'
    if (!/^[a-zA-Z\s.-]+$/.test(city.trim())) return 'City can only contain letters'
    return ''
  }

  const validateState = (state: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!state.trim() || state === '') return 'Please select a state'
    return ''
  }

  const validatePincode = (pincode: string): string => {
    const cleanPincode = pincode.replace(/\D/g, '')
    if (!cleanPincode) return 'Pincode is required'
    if (!/^\d{6}$/.test(cleanPincode)) return 'Enter a valid 6-digit pincode'
    return ''
  }

  const handleNameChange = (value: string) => {
    onChange('name', value)
    setErrors(prev => ({ ...prev, name: validateName(value) }))
  }

  const handlePincodeChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6)
    onChange('pincode', cleanValue)
    setErrors(prev => ({ ...prev, pincode: validatePincode(cleanValue) }))
  }

  const handleAddressLine1Change = (value: string) => {
    onChange('addressLine1', value)
    setErrors(prev => ({ ...prev, addressLine1: validateAddressLine1(value) }))
  }

  const handleAddressLine2Change = (value: string) => {
    onChange('addressLine2', value)
    setErrors(prev => ({ ...prev, addressLine2: validateAddressLine2(value) }))
  }

  const handleCityChange = (value: string) => {
    onChange('city', value)
    setErrors(prev => ({ ...prev, city: validateCity(value) }))
  }

  const handleStateChange = (value: string) => {
    onChange('state', value)
    setErrors(prev => ({ ...prev, state: validateState(value) }))
  }

  const handlePhoneChange = (phone: string) => {
    onChange('phone', phone)
  }

  const handlePhoneValidation = (isValid: boolean) => {
    if (onPhoneValidationChange) onPhoneValidationChange(isValid)
    if (!isValid && formData.phone) {
      setErrors(prev => ({ ...prev, phone: 'Enter a valid phone number' }))
    } else {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleClearAll = () => {
    if (onClear) onClear()
    setErrors({})
    setShowClearConfirm(false)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-sm border border-[#D5D9D9]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0F1111]">
              {shippingMethod === 'delivery' ? 'Delivery Address' : 'Pickup Contact Details'}
            </h3>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="full-name" className={labelClass}>Full name (First and Last name) <span className="text-red-600">*</span></label>
              <input 
                id="full-name" 
                type="text" 
                value={formData.name} 
                onChange={(e) => handleNameChange(e.target.value)} 
                disabled={disabled} 
                required 
                className={errors.name ? errorInputClass : inputClass} 
                placeholder="Enter your full name" 
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="mobile-number" className={labelClass}>Mobile number <span className="text-red-600">*</span></label>
              <PhoneInput
                value={formData.phone}
                onChange={handlePhoneChange}
                onValidationChange={handlePhoneValidation}
                onCountryChange={onCountryChange}
                disabled={disabled}
              />
              {errors.phone && <p className={errorClass}>{errors.phone}</p>}
            </div>

            {shippingMethod === 'pickup' && (
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="pincode" className={labelClass}>Pincode <span className="text-red-600">*</span></label>
                <input 
                  id="pincode" 
                  type="text" 
                  value={formData.pincode} 
                  onChange={(e) => handlePincodeChange(e.target.value)} 
                  disabled={disabled} 
                  required 
                  maxLength={6} 
                  className={errors.pincode ? errorInputClass : inputClass} 
                  placeholder="6 digits [0-9] PIN code" 
                />
                {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
              </div>
            )}

            {shippingMethod === 'delivery' && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="address-line-1" className={labelClass}>Flat, House no., Building, Company, Apartment <span className="text-red-600">*</span></label>
                  <input 
                    id="address-line-1" 
                    type="text" 
                    value={formData.addressLine1} 
                    onChange={(e) => handleAddressLine1Change(e.target.value)} 
                    disabled={disabled} 
                    required 
                    className={errors.addressLine1 ? errorInputClass : inputClass} 
                    placeholder="Flat, House no., Building, etc." 
                  />
                  {errors.addressLine1 && <p className={errorClass}>{errors.addressLine1}</p>}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="address-line-2" className={labelClass}>Area, Street, Sector, Village <span className="text-red-600">*</span></label>
                  <input 
                    id="address-line-2" 
                    type="text" 
                    value={formData.addressLine2} 
                    onChange={(e) => handleAddressLine2Change(e.target.value)} 
                    disabled={disabled} 
                    required
                    className={errors.addressLine2 ? errorInputClass : inputClass} 
                    placeholder="Area, Street, Sector, Village" 
                  />
                  {errors.addressLine2 && <p className={errorClass}>{errors.addressLine2}</p>}
                </div>

                <div className="col-span-1 md:col-span-1">
                  <label htmlFor="city" className={labelClass}>Town/City <span className="text-red-600">*</span></label>
                  <input 
                    id="city" 
                    type="text" 
                    value={formData.city} 
                    onChange={(e) => handleCityChange(e.target.value)} 
                    disabled={disabled} 
                    required 
                    className={errors.city ? errorInputClass : inputClass} 
                    placeholder="Town/City" 
                  />
                  {errors.city && <p className={errorClass}>{errors.city}</p>}
                </div>

                <div className="col-span-1 md:col-span-1">
                  <label htmlFor="state" className={labelClass}>State <span className="text-red-600">*</span></label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={disabled}
                    required
                    className={errors.state ? errorInputClass : inputClass}
                  >
                    <option value="" disabled>Select State</option>
                    {INDIAN_STATES.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className={errorClass}>{errors.state}</p>}
                </div>

                 <div className="col-span-1 md:col-span-2">
                  <label htmlFor="pincode" className={labelClass}>Pincode <span className="text-red-600">*</span></label>
                  <input 
                    id="pincode" 
                    type="text" 
                    value={formData.pincode} 
                    onChange={(e) => handlePincodeChange(e.target.value)} 
                    disabled={disabled} 
                    required 
                    maxLength={6} 
                    className={errors.pincode ? errorInputClass : inputClass} 
                    placeholder="6 digits [0-9] PIN code" 
                  />
                  {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="landmark" className={labelClass}>Landmark</label>
                  <input 
                    id="landmark" 
                    type="text" 
                    value={formData.landmark} 
                    onChange={(e) => onChange('landmark', e.target.value)} 
                    disabled={disabled} 
                    className={inputClass} 
                    placeholder="E.g. near apollo hospital" 
                  />
                </div>

              </>
            )}
          </div>
        </div>

        {shippingMethod === 'delivery' && (
          <div className="bg-white p-5 rounded-sm border border-[#D5D9D9]">
            <h3 className="text-lg font-bold text-[#0F1111] mb-4">Add delivery instructions</h3>
            <div>
              <label htmlFor="delivery-instructions" className="block text-sm font-bold text-[#0F1111] mb-1">Preferences <span className="text-[#565959] font-normal">(Optional)</span></label>
              <textarea 
                id="delivery-instructions"
                value={formData.delivery_instructions} 
                onChange={(e) => onChange('delivery_instructions', e.target.value)} 
                disabled={disabled}
                rows={2} 
                className={`${inputClass} resize-none`} 
                placeholder="E.g., Leave at the back gate, call before arriving..." 
              />
            </div>
          </div>
        )}
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Address Form?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will clear all address details you've entered. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}