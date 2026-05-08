// src/components/ui/PhoneInput.tsx

'use client'

import { useState } from 'react'
import PhoneInputLib, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import type { Country } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

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

  // Default to India (IN) - no IP detection to avoid CORS issues
  const defaultCountry: Country = 'IN'

  const handleChange = (val: string | undefined) => {
    const phone = val ?? ''
    onChange(phone)

    // Extract country from phone number when user types or selects flag
    if (phone && onCountryChange) {
      try {
        const parsed = parsePhoneNumber(phone)
        if (parsed && parsed.country) {
          onCountryChange(parsed.country)
        }
      } catch (e) {
        // ignore parsing errors
      }
    }

    if (onValidationChange) {
      if (!phone) {
        onValidationChange(false) // An empty phone number is not valid if required
      } else {
        onValidationChange(isValidPhoneNumber(phone))
      }
    }
  }

  const handleCountrySelect = (countryCode: Country) => {
    // When user manually selects a flag, notify parent
    if (onCountryChange) {
      onCountryChange(countryCode)
    }
  }

  const showError = touched && value && !isValidPhoneNumber(value)

  return (
    <div>
      <div
        className={`flex items-center border rounded-sm bg-white transition-shadow focus-within:ring-1 ${
          showError || error
            ? 'border-red-600 focus-within:border-red-600 focus-within:ring-red-600'
            : 'border-[#D5D9D9] focus-within:border-[#FF9900] focus-within:ring-[#FF9900]'
        }`}
      >
        <PhoneInputLib
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          onCountryChange={handleCountrySelect}
          disabled={disabled}
          flagUrl="https://flagsapi.com/{XX}/flat/64.png" // 🚨 FIX: Bypasses strict AdBlockers
          className="w-full phone-input-custom px-3 py-2 text-sm text-[#0F1111]"
        />
      </div>

      {showError && !error && (
        <p className="text-xs text-red-600 font-medium mt-1">
          <span className="font-bold"></span>
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