// src/app/(shop)/profile/payments/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { Plus } from 'lucide-react'
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
        
        <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-6 tracking-tight">Your Payment Methods</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
            
            <button className="w-full flex items-center justify-between p-4 border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-[#C7511F] transition-colors">Add a new payment method</div>
                  <div className="text-xs text-gray-500">Credit or debit cards, UPI, and Netbanking</div>
                </div>
              </div>
            </button>

          </div>

        </div>
      </Container>
    </div>
  )
}