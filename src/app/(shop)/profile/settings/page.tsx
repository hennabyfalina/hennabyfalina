// src/app/(shop)/profile/settings/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

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
          
          {/* Communication Preferences */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-5 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Communication Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600]" />
                <div>
                  <div className="text-sm font-bold text-gray-900">Promotional Emails</div>
                  <div className="text-xs text-gray-600 mt-0.5">Receive emails about exclusive offers, new product launches, and packaging tips.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-[#e77600] border-gray-300 rounded-sm focus:ring-[#e77600]" />
                <div>
                  <div className="text-sm font-bold text-gray-900">Order Updates via SMS</div>
                  <div className="text-xs text-gray-600 mt-0.5">Receive text messages for order confirmations, shipping updates, and delivery notifications.</div>
                </div>
              </label>
            </div>
            <button className="mt-6 px-4 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-xs font-medium text-gray-900 shadow-sm transition-colors">
              Save Preferences
            </button>
          </div>

          {/* Account Deletion */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-5 md:p-6">
            <h2 className="text-lg font-bold text-red-600 mb-4 pb-2 border-b border-gray-200">Account Deletion</h2>
            <p className="text-sm text-gray-600 mb-4">
              Closing your account will permanently delete your order history, saved addresses, and payment methods. This action cannot be undone.
            </p>
            <button className="px-4 py-1.5 bg-white border border-gray-300 rounded-sm text-xs font-medium text-red-600 hover:bg-gray-50 shadow-sm transition-colors">
              Request Account Closure
            </button>
          </div>

        </div>
      </Container>
    </div>
  )
}