// src/components/checkout/CheckoutErrorAlert.tsx

'use client'

import { AlertCircle } from 'lucide-react'

interface CheckoutErrorAlertProps {
  error: string | null
}

export default function CheckoutErrorAlert({ error }: CheckoutErrorAlertProps) {
  if (!error) return null
  
  return (
    <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
        <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
      </div>
      <div className="text-[13px] text-gray-600 font-medium leading-relaxed capitalize">
        <span className="font-bold text-red-900">There was a problem processing your order.</span>
        <p className="mt-1 font-medium text-red-700">{error.toLowerCase()}</p>
      </div>
    </div>
  )
}