// src/app/(shop)/profile/settings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'
import ManualUpdateButton from '@/components/ui/ManualUpdateButton'

export const metadata = {
  title: `Account Settings | ${siteConfig.name}`
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/profile/settings')
  }

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[800px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Account Settings</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-6 tracking-tight">Account Settings</h1>

        <div className="space-y-6">
          
          {/* 🆕 PWA Update Section */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-5 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">App Updates</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check for the latest version of the app. This will apply any pending updates and refresh your experience.
            </p>
            <ManualUpdateButton />
          </div>

          
        </div>
      </Container>
    </div>
  )
}