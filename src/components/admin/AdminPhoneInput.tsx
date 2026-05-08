// src/components/admin/AdminPhoneInput.tsx

'use client'

import { useState } from 'react'
import PhoneInputLib, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import type { Country } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

interface AdminPhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  onCountryChange?: (countryCode: string) => void
  error?: string
  disabled?: boolean
}

export default function AdminPhoneInput({
  value,
  onChange,
  onValidationChange,
  onCountryChange,
  error,
  disabled,
}: AdminPhoneInputProps) {
  const [touched, setTouched] = useState(false)

  const defaultCountry: Country = 'IN'

  const handleChange = (val: string | undefined) => {
    const phone = val ?? ''
    onChange(phone)

    if (phone && onCountryChange) {
      try {
        const parsed = parsePhoneNumber(phone)
        if (parsed && parsed.country) {
          onCountryChange(parsed.country)
        }
      } catch (e) {}
    }

    if (onValidationChange) {
      if (!phone) {
        onValidationChange(false)
      } else {
        onValidationChange(isValidPhoneNumber(phone))
      }
    }
  }

  const handleCountrySelect = (countryCode: Country) => {
    if (onCountryChange) {
      onCountryChange(countryCode)
    }
  }

  const showError = touched && value && !isValidPhoneNumber(value)

  return (
    <div>
      <div className={`flex items-center w-full px-4 py-3 bg-[#131314] border ${showError || error ? 'border-[#8C1D18] ring-1 ring-[#8C1D18]' : 'border-[#333538]'} rounded-2xl focus-within:border-[#A8C7FA] focus-within:ring-1 focus-within:ring-[#A8C7FA] transition-all`}>
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
          className="w-full flex items-center gap-3 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:focus:ring-0 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:text-[#E3E3E3] [&_.PhoneInputInput]:placeholder:text-[#565959]"
        />
      </div>
      {showError && !error && <p className="text-[#F2B8B5] text-[10px] font-medium mt-1 ml-1">Please enter a valid phone number</p>}
      {error && <p className="text-[#F2B8B5] text-[10px] font-medium mt-1 ml-1">{error}</p>}
    </div>
  )
}