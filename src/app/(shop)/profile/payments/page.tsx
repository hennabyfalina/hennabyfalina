// src/app/(shop)/profile/payments/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'
import { ChevronRight, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: `Payment Options | ${siteConfig.name} Studio`
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/profile/payments')
  }

  return (
    <div className="min-h-screen bg-white py-8 md:py-14 select-none font-sans antialiased text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Breadcrumb Navigation - Converted to Premium Capitalized Semibold Tones */}
        <div className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1">
          <Link href="/profile">Your Account</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Payment Options</span>
        </div>

        {/* Master Page Header */}
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 mb-8 tracking-tight capitalize">Payment Options</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {/* 🚀 FIXED: Clean borderless Google-style layout with Razorpay branding */}
            <div className="w-full flex items-start py-2 bg-white">
              <div className="flex items-start gap-4 w-full">
                
                {/* Razorpay Brand Icon */}
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  <Image 
                    src="/razorpay-icon.jpg" 
                    alt="Razorpay" 
                    width={40} 
                    height={40} 
                    className="object-contain"
                  />
                </div>

                {/* Secure Gateway Description Metadata */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="font-normal text-gray-950 text-[15px] sm:text-[16px] tracking-tight capitalize mb-1.5">
                    Secure Payments by Razorpay
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-gray-400 font-normal leading-relaxed capitalize">
                    We do not store your payment methods or personal card details on our servers. All transactions are securely encrypted and processed directly by Razorpay, supporting Credit/Debit Cards, UPI Instant Transfers, Netbanking, and other verified payment portals.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  )
}