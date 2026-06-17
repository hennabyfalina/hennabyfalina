// src/components/checkout/CheckoutHeader.tsx

'use client'

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { Timer, Lock } from 'lucide-react'

interface CheckoutHeaderProps {
  currentStep: number;
  formattedTime?: string;
  isExpired?: boolean;
}

export default function CheckoutHeader({ currentStep, formattedTime, isExpired }: CheckoutHeaderProps) {
  return (
    <header className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 py-4 fixed top-0 left-0 right-0 z-[100] shadow-none select-none font-sans antialiased">
      <Container className="max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-3 items-center w-full">
          
          {/* Left Column: Back to Cart Action */}
          <div className="flex items-center justify-start">
            {currentStep === 1 ? (
              <Link 
                href="/cart"
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <span className="text-[15px] font-semibold tracking-wide capitalize">Cancel</span>
              </Link>
            ) : currentStep === 2 ? (
              <div className="flex items-center gap-1.5 text-white/60 select-none">
                <Lock className="w-4 h-4" strokeWidth={2} />
                <span className="text-[14px] font-medium tracking-wide hidden sm:inline capitalize">Secure</span>
              </div>
            ) : null}
          </div>
          
          {/* Center Column: Static Title */}
          <div className="flex items-center justify-center">
            <span className="text-[20px] sm:text-[20px] font-semibold tracking-wide whitespace-nowrap capitalize text-white">
              Checkout
            </span>
          </div>
          
          {/* Right Column: Timer */}
          <div className="flex items-center justify-end">
            {formattedTime && !isExpired && currentStep < 3 && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium transition-all ${
                parseInt(formattedTime.split(':')[0]) < 3 ? 'text-red-400 bg-red-500/10' : 'text-gray-300'
              }`}>
                <Timer className={`w-4 h-4 shrink-0 ${parseInt(formattedTime.split(':')[0]) < 3 ? 'animate-pulse text-red-400' : 'text-gray-400'}`} strokeWidth={2.5} />
                <span className="tabular-nums tracking-wide">{formattedTime}</span>
              </div>
            )}
          </div>

        </div>
      </Container>
    </header>
  )
}