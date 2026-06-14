// src/app/(shop)/profile/security/SecurityClient.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import PhoneInput from '@/components/ui/PhoneInput'
import { ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react'

interface SecurityClientProps {
  sessionUser: any
  userData: any
  addressPhone?: string | null
}

export default function SecurityClient({ sessionUser, userData, addressPhone }: SecurityClientProps) {
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const initialPhone = addressPhone || userData?.phone || sessionUser?.phone || sessionUser?.user_metadata?.phone || ''
  const [phone, setPhone] = useState(initialPhone)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const displayName = userData?.name || sessionUser.user_metadata?.name || 'Not Provided'
  const email = sessionUser.email || 'Not Provided'

  // Determine Primary Login Provider Context Maps
  const providers = sessionUser.app_metadata?.providers || []
  let primaryLogin = 'Email'
  
  if (providers.includes('google')) {
    primaryLogin = 'Google Account'
  } else if (providers.includes('phone')) {
    primaryLogin = 'Mobile Number'
  } else if (providers.includes('email')) {
    primaryLogin = 'Email'
  }

  const isPhonePrimary = primaryLogin === 'Mobile Number'
  const isEmailOrGooglePrimary = primaryLogin === 'Email' || primaryLogin === 'Google Account'

  const handleSavePhone = async () => {
    if (!phone) {
      showToast('Phone number field cannot be empty')
      return
    }

    if (!isPhoneValid) {
      showToast('Please provide a valid active phone tracking number')
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('addresses')
        .update({ phone: phone })
        .eq('user_id', sessionUser.id)

      if (error) {
        console.error('Supabase update parameter runtime failure:', error)
        showToast(error.message || 'Failed to sync update logs securely')
      } else {
        showToast('Mobile contact details updated successfully', 'success')
        setIsEditingPhone(false)
      }
    } catch (err: any) {
      console.error('Unexpected runtime configuration exception:', err)
      showToast('An unexpected internal connection mismatch occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-8 md:py-14 font-sans antialiased select-none text-left">
      <Container className="max-w-[800px] px-4 sm:px-8">
        
        {/* 🚀 FIXED: Converted old teal/orange breadcrumbs to clean Capitalized semibold styles */}
        <div className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1">
          <Link href="/profile">Your Account</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Login & Security</span>
        </div>
        
        {/* Title & Status Badge Setup */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <h1 className="text-2xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">Login & Security</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 rounded-full text-[11px] sm:text-[12px] font-bold text-gray-500 capitalize shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400 hidden sm:block" strokeWidth={2} />
            <span className="whitespace-nowrap">{primaryLogin}</span>
          </div>
        </div>

        {/* 🚀 ULTRA-CLEAN: Borderless Apple-style interactive list */}
        <div className="bg-white space-y-0">
          
          {/* Name Parameter Row */}
          <div className="py-6 flex justify-between items-center border-b border-gray-50 bg-white">
            <div className="space-y-1">
              <div className="font-bold text-gray-400 text-[11px] tracking-widest uppercase">Name</div>
              <div className="text-gray-900 text-[16px] font-medium capitalize">
                {displayName}
              </div>
            </div>
            <div className="text-[13px] font-semibold text-stone-300 capitalize">
              System Closed
            </div>
          </div>

          {/* Email Parameter Row */}
          <div className="py-6 flex justify-between items-center border-b border-gray-50 bg-white">
            <div className="space-y-1">
              <div className="font-bold text-gray-400 text-[11px] tracking-widest uppercase">Email Address</div>
              <div className="text-gray-900 text-[16px] font-medium">
                {email}
              </div>
            </div>
            {isEmailOrGooglePrimary ? (
              <div className="text-[12px] font-semibold text-gray-400 bg-stone-50 border border-gray-100 px-2.5 py-0.5 rounded-md capitalize">
                Login Anchor
              </div>
            ) : (
              <div className="text-[13px] font-semibold text-stone-300 capitalize">
                System Closed
              </div>
            )}
          </div>

          {/* Primary Mobile Number Parameter Interactive Row */}
          {!isEditingPhone ? (
            <div className="py-6 flex justify-between items-center bg-white">
              <div className="space-y-1">
                <div className="font-bold text-gray-400 text-[11px] tracking-widest uppercase">Primary Mobile Number</div>
                <div className="text-gray-900 text-[16px] font-medium">
                  {phone || 'Not Provided'}
                </div>
                <div className="text-[13px] text-gray-400 font-normal capitalize">Securely linked for verification and live dispatches</div>
              </div>
              
              {phone ? (
                <div className="text-[13px] font-semibold text-stone-300 capitalize text-right">
                  {isPhonePrimary ? 'Login Anchor' : 'System Closed'}
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="h-9 px-4 bg-stone-50 hover:bg-stone-100 rounded-full text-[13px] font-semibold text-gray-800 transition-colors capitalize cursor-pointer"
                >
                  Add Link
                </button>
              )}
            </div>
          ) : (
            /* Inline Dropdown Input Area Panel Container */
            <div className="py-8 px-6 bg-stone-50/50 rounded-2xl my-4 animate-fade-in">
              <div className="font-bold text-gray-900 text-[14px] mb-4 capitalize">Update Verification Mobile Number</div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <div className="w-full sm:max-w-xs bg-white rounded-xl border border-gray-200 p-1">
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    onValidationChange={setIsPhoneValid}
                  />
                </div>
                
                {/* 🚀 FIXED: Transformed yellow buttons into clean, monochrome high-readability targets */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button 
                    type="button"
                    onClick={handleSavePhone} 
                    disabled={isSaving || !isPhoneValid} 
                    className="h-11 px-6 bg-black hover:bg-stone-900 text-white rounded-full text-[13px] font-semibold transition-colors disabled:opacity-30 cursor-pointer capitalize shadow-none"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Parameters'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditingPhone(false)
                      setPhone(initialPhone)
                    }} 
                    className="h-11 px-6 bg-white border border-gray-200 hover:bg-stone-50 text-gray-600 font-semibold rounded-full text-[13px] transition-colors cursor-pointer capitalize"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </Container>
    </div>
  )
}