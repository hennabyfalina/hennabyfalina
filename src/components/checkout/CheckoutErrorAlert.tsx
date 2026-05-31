// src/components/checkout/CheckoutErrorAlert.tsx

'use client'

import { AlertTriangle } from 'lucide-react'

interface CheckoutErrorAlertProps {
  error: string | null
}

export default function CheckoutErrorAlert({ error }: CheckoutErrorAlertProps) {
  if (!error) return null
  
  return (
    <div className="mb-6 p-4 bg-[#FFF4F4] border border-[#F2B8B5] rounded-sm flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
      <AlertTriangle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" />
      <div className="text-sm text-[#4D2628]"><span className="font-bold">There was a problem with your order.</span><p className="mt-1">{error}</p></div>
    </div>
  )
}