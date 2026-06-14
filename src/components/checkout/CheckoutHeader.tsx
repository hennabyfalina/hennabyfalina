// src/components/checkout/CheckoutHeader.tsx

'use client'

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { Lock, ArrowLeft } from 'lucide-react'

export default function CheckoutHeader() {
  return (
    <header className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 py-4 fixed top-0 left-0 right-0 z-[100] shadow-none select-none font-sans antialiased">
      <Container className="max-w-[1400px] px-4 sm:px-8">
        <div className="grid grid-cols-3 items-center w-full">
          
          {/* Left Column: Back to Cart Action */}
          <div className="flex items-center justify-start">
            <Link 
              href="/cart"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              
              <span className="text-[15px] font-semibold tracking-wide capitalize">Cancel</span>
            </Link>
          </div>
          
          {/* Center Column: Static Title */}
          <div className="flex items-center justify-center">
            <span className="text-[20px] sm:text-[20px] font-semibold tracking-wide whitespace-nowrap capitalize text-white">
              Checkout
            </span>
          </div>
          
          {/* Right Column: Discrete Secure Encryption Badge */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 text-white/60">
              <Lock className="w-4 h-4 text-white/50" strokeWidth={1.8} />
              <span className="text-[13px] font-medium tracking-wide hidden md:inline capitalize">Secure Transaction</span>
            </div>
          </div>

        </div>
      </Container>
    </header>
  )
}