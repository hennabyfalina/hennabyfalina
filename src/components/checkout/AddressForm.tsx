// src/components/checkout/AddressForm.tsx

'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'
import PhoneInput from '@/components/ui/PhoneInput'
import { INDIAN_STATES } from '@/lib/states'

export interface AddressFormData {
  fullName: string
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
  hideTitle?: boolean
}

export default function AddressForm({
  formData,
  onChange,
  onPhoneValidationChange,
  onCountryChange,
  shippingMethod,
  disabled = false,
  hideTitle = false,
}: AddressFormProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (showClearConfirm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showClearConfirm])

  // 🚀 FIXED: App-Native highly accessible inputs. Increased height, 16px text (prevents iOS zoom), and visible soft borders.
  const inputClass = "w-full h-[52px] bg-gray-50/50 border border-gray-200 rounded-xl px-4 focus:bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-[16px] font-medium text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 placeholder:font-normal"
  const errorInputClass = "w-full h-[52px] bg-red-50/50 border border-red-300 rounded-xl px-4 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none text-[16px] font-medium text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-red-400"
  const labelClass = "block text-[16px] sm:text-[16px] font-semibold text-gray-900 tracking-tight capitalize mb-2"
  const errorClass = "text-[12px] text-red-500 mt-1.5 font-medium flex items-center gap-1.5 animate-fade-in capitalize"

  // Validation functions (Upgraded strings to clean capitalized style outputs)
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 100) return 'Name configuration is too long'
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) return 'Name can only contain letters'
    return ''
  }

  const validateAddressLine1 = (address: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!address.trim()) return 'Address details are required'
    if (address.trim().length < 2) return 'Address details must be longer'
    return ''
  }

  const validateAddressLine2 = (address: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (address.trim().length > 0 && address.trim().length < 3) return 'Must be at least 3 characters'
    return ''
  }

  const validateCity = (city: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!city.trim()) return 'Town or city field is required'
    if (city.trim().length < 2) return 'City name must be valid'
    if (!/^[a-zA-Z\s.-]+$/.test(city.trim())) return 'City can only contain letters'
    return ''
  }

  const validateState = (state: string): string => {
    if (shippingMethod !== 'delivery') return ''
    if (!state.trim() || state === '') return 'Please select a state context parameters'
    return ''
  }

  const validatePincode = (pincode: string): string => {
    const cleanPincode = pincode.replace(/\D/g, '')
    if (!cleanPincode) return 'Postal pincode is required'
    if (!/^\d{6}$/.test(cleanPincode)) return 'Enter a valid 6-digit pin structure'
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

  const handleThemeStateChange = (value: string) => {
    onChange('state', value)
    setErrors(prev => ({ ...prev, state: validateState(value) }))
  }

  const handlePhoneChange = (phone: string) => {
    onChange('phone', phone)
  }

  const handlePhoneValidation = (isValid: boolean) => {
    if (onPhoneValidationChange) onPhoneValidationChange(isValid)
    if (!isValid && formData.phone) {
      setErrors(prev => ({ ...prev, phone: 'Enter a valid phone number parameter' }))
    } else {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleClearAll = () => {
    onChange('name', '')
    onChange('phone', '')
    onChange('pincode', '')
    onChange('addressLine1', '')
    onChange('addressLine2', '')
    onChange('city', '')
    onChange('state', '')
    onChange('landmark', '')
    onChange('delivery_instructions', '')
    setErrors({})
    setShowClearConfirm(false)
  }

  return (
    <div style={{ colorScheme: 'light' }} className="select-none animate-fade-in w-full text-left font-sans antialiased">
      <div className="space-y-8">
        
        {/* Flat Open Head Section with Capitalized Title Labels */}
        {!hideTitle && (
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 w-full">
            <h3 className="text-[16px] sm:text-[17px] font-semibold text-gray-900 tracking-tight capitalize">
              {shippingMethod === 'delivery' ? 'Delivery Address' : 'Home Pickup Contact Details'}
            </h3>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={disabled}
              className="flex items-center gap-1.5 h-8 text-[13px] font-medium text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer capitalize"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span>Clear Form</span>
            </button>
          </div>
        )}
        
        {/* Main Grid Field Inputs Track */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 w-full">
          
          {/* Name Fields */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="full-name" className={labelClass}>Full Name <span className="text-red-500 font-normal">*</span></label>
            <input 
              id="full-name" 
              type="text" 
              value={formData.name || ''} 
              onChange={(e) => handleNameChange(e.target.value)} 
              disabled={disabled} 
              required 
              className={errors.name ? errorInputClass : inputClass} 
              placeholder="First and last name" 
            />
            {errors.name && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.name}</span></p>}
          </div>

          {/* Phone Fields */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="mobile-number" className={labelClass}>Mobile Number <span className="text-red-500 font-normal">*</span></label>
            <div className={`w-full h-[52px] flex items-center rounded-xl overflow-hidden transition-all bg-gray-50/50 border focus-within:bg-white focus-within:ring-1 ${errors.phone ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-400' : 'border-gray-200 focus-within:border-gray-400 focus-within:ring-gray-400'}`}>
              <PhoneInput
                value={formData.phone}
                onChange={handlePhoneChange}
                onValidationChange={handlePhoneValidation}
                onCountryChange={onCountryChange}
                disabled={disabled}
              />
            </div>
            {errors.phone && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.phone}</span></p>}
          </div>

          {/* Standard Home Delivery Fields Layout Stream */}
          {shippingMethod === 'delivery' && (
            <>
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="address-line-1" className={labelClass}>Apartment, House, Flat Details <span className="text-red-500 font-normal">*</span></label>
                <input 
                  id="address-line-1" 
                  type="text" 
                  value={formData.addressLine1 || ''} 
                  onChange={(e) => handleAddressLine1Change(e.target.value)} 
                  disabled={disabled} 
                  required 
                  className={errors.addressLine1 ? errorInputClass : inputClass} 
                  placeholder="Flat, building number, house name" 
                />
                {errors.addressLine1 && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.addressLine1}</span></p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="address-line-2" className={labelClass}>Area, Street, Locality</label>
                <input 
                  id="address-line-2" 
                  type="text" 
                  value={formData.addressLine2 || ''} 
                  onChange={(e) => handleAddressLine2Change(e.target.value)} 
                  disabled={disabled} 
                  className={errors.addressLine2 ? errorInputClass : inputClass} 
                  placeholder="Sector, street layout, village details" 
                />
                {errors.addressLine2 && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.addressLine2}</span></p>}
              </div>

              <div className="col-span-1">
                <label htmlFor="city" className={labelClass}>Town or City <span className="text-red-500 font-normal">*</span></label>
                <input 
                  id="city" 
                  type="text" 
                  value={formData.city || ''} 
                  onChange={(e) => handleCityChange(e.target.value)} 
                  disabled={disabled} 
                  required 
                  className={errors.city ? errorInputClass : inputClass} 
                  placeholder="City location" 
                />
                {errors.city && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.city}</span></p>}
              </div>

              <div className="col-span-1">
                <label htmlFor="state" className={labelClass}>State <span className="text-red-500 font-normal">*</span></label>
                <div className="relative">
                  <select
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleThemeStateChange(e.target.value)}
                    disabled={disabled}
                    required
                    className={`${errors.state ? errorInputClass : inputClass} cursor-pointer appearance-none pr-8 capitalize`}
                  >
                    <option value="" disabled className="bg-white text-gray-400">Select state</option>
                    {INDIAN_STATES.map((stateName) => (
                      <option key={stateName} value={stateName} className="bg-white text-gray-900 capitalize">
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.state && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.state}</span></p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="pincode" className={labelClass}>Pincode <span className="text-red-500 font-normal">*</span></label>
                <input 
                  id="pincode" 
                  type="text" 
                  value={formData.pincode || ''} 
                  onChange={(e) => handlePincodeChange(e.target.value)} 
                  disabled={disabled} 
                  required 
                  maxLength={6} 
                  className={errors.pincode ? errorInputClass : inputClass} 
                  placeholder="6 digit pincode code" 
                />
                {errors.pincode && <p className={errorClass}><AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} /><span>{errors.pincode}</span></p>}
              </div>
            </>
          )}
        </div>

        {/* Optional Section: Instructions Options */}
        {shippingMethod === 'delivery' && (
          <div className="pt-6 border-t border-gray-100 flex flex-col gap-5 w-full">
            <h3 className="text-[27px] font-normal text-gray-900 tracking-tight capitalize">Delivery Instructions <span className="text-gray-400 font-normal text-xl">(Optional)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-full">
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="landmark" className={labelClass}>Landmark</label>
                <input 
                  id="landmark" 
                  type="text" 
                  value={formData.landmark || ''} 
                  onChange={(e) => onChange('landmark', e.target.value)} 
                  disabled={disabled} 
                  className={inputClass} 
                  placeholder="e.g. Near specific landscape identifier" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="delivery-instructions" className={labelClass}>Preferences</label>
                <textarea 
                  id="delivery-instructions"
                  value={formData.delivery_instructions || ''} 
                  onChange={(e) => onChange('delivery_instructions', e.target.value)} 
                  disabled={disabled}
                  rows={2} 
                  className="w-full min-h-[100px] p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-[16px] font-medium text-gray-900 transition-all disabled:opacity-50 resize-none placeholder:text-gray-400 placeholder:font-normal" 
                  placeholder="e.g. Place inside delivery slot box, contact security prior to arrival..." 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CLEAR INPUT CONFIRMATION SHEET OVERLAY PORTAL SHEET                       */}
      {/* ========================================================================= */}
      {showClearConfirm && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/10 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowClearConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-zoom-in text-left flex flex-col gap-4">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-950 capitalize">Clear Input Data?</h3>
              <p className="text-[13px] text-gray-500 font-normal mt-1 leading-relaxed">
                This process will erase all input variables typed out inside this session slate. This action is final.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2 w-full">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-10 text-[13px] font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-colors cursor-pointer capitalize"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 h-10 text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer capitalize shadow-xs"
              >
                Clear Form
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}