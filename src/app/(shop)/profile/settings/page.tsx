// src/app/(shop)/profile/settings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'
import ManualUpdateButton from '@/components/ui/ManualUpdateButton'
import PasskeyManager from '@/components/profile/PasskeyManager'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: `Account Settings | ${siteConfig.name} Studio`
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/profile/settings')
  }

  return (
    <div className="min-h-screen bg-white py-8 md:py-14 select-none font-sans antialiased text-left">
      <Container className="max-w-[800px] px-4 sm:px-8">
        
        {/* 🚀 FIXED: Converted old design breadcrumbs into crisp, clean Capitalized semibold styles */}
        <div className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1">
          <Link href="/profile">Your Account</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Account Settings</span>
        </div>
        
        {/* Title Block Header */}
        <h1 className="text-[27px] md:text-[32px] font-normal text-gray-900 mb-10 tracking-tight capitalize">Account Settings</h1>

        <div className="space-y-12">
          
          {/* 🆕 PWA App Version Updates Section */}
          <div className="bg-white flex flex-col gap-4">
            <h2 className="text-[20px] font-normal text-gray-950 tracking-tight capitalize">
              App Updates
            </h2>
            <p className="text-[15px] text-gray-500 font-normal leading-relaxed max-w-xl">
              Check for the latest version of our studio experience. This will apply pending updates, refresh cached routes, and optimize performance.
            </p>
            <div className="pt-2">
              <ManualUpdateButton />
            </div>
          </div>

          {/* 🔐 Secure Biometric Passkeys Section */}
          <div className="bg-white flex flex-col gap-4 pt-8 border-t border-gray-100">
            <h2 className="text-[20px] font-normal text-gray-950 tracking-tight capitalize">
              Passkeys Authorization
            </h2>
            <PasskeyManager />
          </div>

        </div>
      </Container>
    </div>
  )
}