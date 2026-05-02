// src/app/(shop)/profile/payments/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Payment Options | ${siteConfig.name}`
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/profile/payments')
  }

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Payment options</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6 pt-2">
            
            <div className="w-full flex items-start p-5 border border-gray-300 bg-gray-50 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shrink-0 mt-0.5 overflow-hidden p-1.5">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="https://ps.w.org/razorpay-quick-payments/assets/icon-256x256.png?rev=2256765" className="w-full h-full text-[#3395FF]">
                    <path d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l6.395-24z" fill="currentColor" />
                    <path d="M1.564 0l-.44 1.606L8.4 1.547l.45-1.547H1.564z" fill="currentColor" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 mb-1">Secure Payments by Razorpay</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    We do not store your payment methods or card details on our servers. All transactions are securely encrypted and processed by Razorpay, supporting Credit/Debit Cards, UPI, Netbanking, and more.
                  </div>
                  
                </div>
              </div>
            </div>

          </div>

        </div>
      </Container>
    </div>
  )
}