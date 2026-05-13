// src/components/ui/PhoneInput.tsx

'use client'

import { useState } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  onCountryChange?: (countryCode: string) => void
  error?: string
  disabled?: boolean
}

export default function PhoneInput({
  value,
  onChange,
  onValidationChange,
  onCountryChange,
  error,
  disabled,
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false)

  // Always default to India for compatibility
  if (onCountryChange && !value) {
    onCountryChange('IN')
  }

  // Clean the incoming value for display (strip +91 if present)
  const displayValue = value.startsWith('+91') 
    ? value.slice(3) 
    : (value.startsWith('91') && value.length === 12 ? value.slice(2) : value.replace(/\D/g, '').slice(0, 10))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawNumbers = e.target.value.replace(/\D/g, '').slice(0, 10)
    const fullPhone = rawNumbers.length > 0 ? `+91${rawNumbers}` : ''
    
    onChange(fullPhone)
    
    if (onValidationChange) {
      onValidationChange(rawNumbers.length === 10)
    }
  }

  const showError = touched && displayValue.length > 0 && displayValue.length < 10

  return (
    <div>
      <div
        className={`flex items-stretch border rounded-sm bg-white transition-shadow focus-within:ring-1 ${
          showError || error
            ? 'border-red-600 focus-within:border-red-600 focus-within:ring-red-600'
            : 'border-[#D5D9D9] focus-within:border-[#FF9900] focus-within:ring-[#FF9900]'
        }`}
      >
        <div className="flex items-center justify-center px-3 bg-[#F3F4F6] border-r border-[#D5D9D9] text-[15px] font-bold text-[#565959] select-none">
          +91
        </div>
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder="10-digit mobile number"
          className="w-full px-3 py-2.5 sm:py-3 text-[15px] font-medium text-[#0F1111] bg-transparent border-none outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          maxLength={10}
        />
      </div>

      {showError && !error && (
        <p className="text-xs text-red-600 font-medium mt-1">
          <span className="font-bold"></span>
          Please enter a valid 10-digit mobile number
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 font-medium mt-1">
          <span className="font-bold">!</span> {error}
        </p>
      )}
      {!showError && !error && (
        <p className="text-xs text-gray-500 mt-1">
        </p>
      )}
    </div>
  )
}