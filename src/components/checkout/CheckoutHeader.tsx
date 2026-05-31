// src/components/checkout/CheckoutHeader.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { checkoutConfig } from '@/config/checkout'
import Container from '@/components/ui/Container'
import { ChevronDown, Lock, ShieldCheck } from 'lucide-react'

export default function CheckoutHeader() {
  const [showSecurityInfo, setShowSecurityInfo] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showSecurityInfo && !target.closest('.security-dropdown')) {
        setShowSecurityInfo(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showSecurityInfo])

  return (
    <header className="bg-white border-b border-[#D5D9D9] py-3 fixed top-0 left-0 right-0 z-[100] shadow-sm">
      <Container className="max-w-[1500px]">
        <div className="grid grid-cols-3 items-center w-full">
          <div className="flex items-center justify-start">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-white flex-shrink-0 pointer-events-none">
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex items-center justify-center relative security-dropdown">
            <button
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="flex items-center gap-2 text-[#0F1111]"
              aria-label="Security information"
            >
              <span className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap">{checkoutConfig.security.title}</span>
              <ChevronDown className={`w-4 h-4 text-gray-600 hover:text-gray-900 transition-transform cursor-pointer ${showSecurityInfo ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-end relative">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium hidden sm:inline">Secure transaction</span>
              <span className="text-xs font-medium sm:hidden"></span>
            </div>
          </div>
        </div>
      </Container>

      {showSecurityInfo && mounted && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowSecurityInfo(false)}>
          <div className="relative bg-white rounded-sm shadow-xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200 border border-[#D5D9D9]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSecurityInfo(false)} className="absolute -top-10 right-0 text-white hover:text-gray-200 transition-colors p-2 cursor-pointer flex items-center gap-1 text-sm font-medium" aria-label="Close">
              <span>Close</span>
            </button>
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-base text-[#0F1111] leading-relaxed font-bold">{checkoutConfig.security.modal.description}</p>
              </div>
              <div className="space-y-4">
                {checkoutConfig.security.modal.points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3"><div className="w-1 h-1 rounded-full bg-gray-400 shrink-0 mt-2" /><p className="text-[15px] text-gray-600 leading-snug">{point}</p></div>
                ))}
              </div>
              <div className="pt-6 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest text-gray-400 border-t border-gray-100"><span>{checkoutConfig.security.modal.footer}</span></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}