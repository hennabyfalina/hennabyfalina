// src/components/ui/PhoneInput.tsx

'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

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

  if (onCountryChange && !value) {
    onCountryChange('IN')
  }

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
    <div className="select-none text-left font-sans antialiased w-full">
      
      {/* 🚀 FIXED: Stripped grey background caps and hard borders into a flat inline layout block */}
      <div
        className={`flex items-center w-full bg-transparent transition-colors ${
          showError || error ? 'text-red-500' : 'text-gray-950'
        }`}
      >
        {/* Country code prefix tag aligned directly on the input line */}
        <div className="flex items-center h-11 px-4 text-[16px] font-medium text-gray-400 select-none">
          +91
        </div>
        
        {/* Flat seamless text field */}
        <input
          type="tel"
          pattern="[0-9]*"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder="10-digit mobile number"
          className="w-full h-11 bg-transparent border-none outline-none text-[16px] font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 placeholder:font-normal placeholder:lowercase pr-4"
          maxLength={10}
        />
      </div>

      {/* 🚀 FIXED: Subdued lowercase alerts to match our borderless Google theme standards */}
      {showError && !error && (
        <p className="text-[12px] text-red-500 mt-1 font-normal flex items-center gap-1 lowercase animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>please enter a valid 10-digit mobile number</span>
        </p>
      )}
      {error && (
        <p className="text-[12px] text-red-500 mt-1 font-normal flex items-center gap-1 lowercase animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{error.toLowerCase()}</span>
        </p>
      )}
    </div>
  )
}