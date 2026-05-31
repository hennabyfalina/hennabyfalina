// src/components/admin/AdminPhoneInput.tsx

'use client'

import { useState } from 'react'

interface AdminPhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  error?: string
  disabled?: boolean
}

export default function AdminPhoneInput({
  value,
  onChange,
  onValidationChange,
  error,
  disabled,
}: AdminPhoneInputProps) {
  const [touched, setTouched] = useState(false)

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
      <div className={`flex items-stretch w-full overflow-hidden admin-bg-primary border ${showError || error ? 'border-[#8C1D18] ring-1 ring-[#8C1D18]' : 'admin-border'} rounded-2xl focus-within:border-[#A8C7FA] focus-within:ring-1 focus-within:ring-[#A8C7FA] transition-all`}>
        <div className="flex items-center justify-center px-4 admin-bg-card border-r admin-border text-sm font-bold admin-text-muted select-none">
          +91
        </div>
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder="10-digit mobile number"
          className="w-full px-4 py-3 text-sm font-medium admin-text-primary bg-transparent border-none outline-none disabled:opacity-50 placeholder:text-[#565959]"
          maxLength={10}
        />
      </div>
      {showError && !error && <p className="text-[#F2B8B5] text-[10px] font-medium mt-1 ml-1">Please enter a valid 10-digit mobile number</p>}
      {error && <p className="text-[#F2B8B5] text-[10px] font-medium mt-1 ml-1">{error}</p>}
    </div>
  )
}