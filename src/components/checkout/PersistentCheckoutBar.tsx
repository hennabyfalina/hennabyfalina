// src/components/checkout/PersistentCheckoutBar.tsx

'use client'

import { formatCurrency } from '@/lib/utils'
import { Lock } from 'lucide-react'

interface PersistentCheckoutBarProps {
  finalTotal: number
  shippingCost: number
  buttonText: string
  onClick: () => void
  isDisabled: boolean
  isProcessing: boolean
  currentStep?: number
  checkoutStatus?: 'idle' | 'success' | 'failed'
  onSecondaryClick?: () => void
  secondaryButtonText?: string
}

export default function PersistentCheckoutBar({
  finalTotal,
  shippingCost,
  buttonText,
  onClick,
  isDisabled,
  isProcessing,
  currentStep = 1,
  checkoutStatus = 'idle',
  onSecondaryClick,
  secondaryButtonText
}: PersistentCheckoutBarProps) {
  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE VIEW BASE ATTACHED BOTTOM SHEET LAYER                              */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[110]" style={{ position: 'fixed', bottom: 0 }}>
        <div className="bg-[#F0F7FF] border-t border-blue-100/50 px-5 py-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] font-sans antialiased text-left select-none shadow-2xl">
          {currentStep === 3 ? (
            <div className="flex flex-row items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={onClick}
                disabled={isDisabled}
                className="flex-1 h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[14px] font-medium tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-none outline-none"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  buttonText
                )}
              </button>
              {secondaryButtonText && onSecondaryClick && (
                <button
                  type="button"
                  onClick={onSecondaryClick}
                  className="flex-1 h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl text-[14px] font-medium transition-all shadow-none cursor-pointer outline-none whitespace-nowrap"
                >
                  {secondaryButtonText}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                type="button"
                onClick={onClick}
                disabled={isDisabled}
                className="w-full h-12 bg-black hover:bg-stone-900 text-white rounded-xl text-[15px] font-normal tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer normal shadow-none outline-none"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {buttonText.includes('Pay') && <Lock className="w-3.5 h-3.5 text-white/90" strokeWidth={2.5} />}
                    <span>{buttonText}</span>
                  </>
                )}
              </button>
            </div>
          )}
          
        </div>
      </div>
    </>
  )
}