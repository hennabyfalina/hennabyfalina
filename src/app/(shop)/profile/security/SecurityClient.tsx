// src/app/(shop)/profile/security/SecurityClient.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import PhoneInput from '@/components/ui/PhoneInput'

interface SecurityClientProps {
  sessionUser: any
  userData: any
}

export default function SecurityClient({ sessionUser, userData }: SecurityClientProps) {
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phone, setPhone] = useState(userData?.phone || sessionUser.phone || '')
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const displayName = userData?.name || sessionUser.user_metadata?.name || 'Not provided'
  const email = sessionUser.email || 'Not provided'

  // Determine Primary Login Provider
  const providers = sessionUser.app_metadata?.providers || []
  let primaryLogin = 'Email'
  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
  
  if (providers.includes('google')) {
    primaryLogin = 'Google'
    badgeColor = 'bg-red-50 text-red-700 border-red-200'
  } else if (providers.includes('phone')) {
    primaryLogin = 'Mobile Number'
    badgeColor = 'bg-green-50 text-green-700 border-green-200'
  } else if (providers.includes('email')) {
    primaryLogin = 'Email'
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
  }

  const isPhonePrimary = primaryLogin === 'Mobile Number'
  const isEmailOrGooglePrimary = primaryLogin === 'Email' || primaryLogin === 'Google'

  const handleSavePhone = async () => {
    if (!phone) {
      showToast('Phone number cannot be empty')
      return
    }

    if (!isPhoneValid) {
      showToast('Please enter a valid phone number with country code')
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('users')
        .update({ phone: phone })
        .eq('id', sessionUser.id)

      if (error) {
        console.error('Supabase update error:', error)
        showToast(error.message || 'Failed to update phone number')
      } else {
        showToast('Phone number updated successfully')
        setIsEditingPhone(false)
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      showToast('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[800px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Login & security</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">Login & security</h1>
          
          {/* Compact Primary Login Badge */}
          <div className={`inline-flex items-center px-2.5 py-1 rounded-sm border text-xs font-medium ${badgeColor} shadow-sm`}>
            Primary: {primaryLogin}
          </div>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
          
          {/* Name Row */}
          <div className="p-4 sm:p-5 flex justify-between items-center border-b border-gray-200">
            <div>
              <div className="font-bold text-gray-900 text-sm">Name</div>
              <div className="text-gray-600 text-sm mt-1">{displayName}</div>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              Cannot edit
            </div>
          </div>

          {/* Email Row */}
          <div className="p-4 sm:p-5 flex justify-between items-center border-b border-gray-200">
            <div>
              <div className="font-bold text-gray-900 text-sm">Email</div>
              <div className="text-gray-600 text-sm mt-1">{email}</div>
            </div>
            {isEmailOrGooglePrimary ? (
              <div className="text-xs text-gray-400 font-medium text-right">
                Primary login
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-medium">
                Cannot edit
              </div>
            )}
          </div>

          {/* Phone Row */}
          {!isEditingPhone ? (
            <div className="p-4 sm:p-5 flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900 text-sm">Primary mobile number</div>
                <div className="text-gray-600 text-sm mt-1">{phone || 'Not provided'}</div>
                <div className="text-xs text-gray-500 mt-1">Securely receive delivery updates</div>
              </div>
              
              {isPhonePrimary ? (
                <div className="text-xs text-gray-400 font-medium text-right">
                  Primary login
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingPhone(true)}
                  className="px-4 py-1.5 bg-white border border-gray-300 rounded-sm text-xs font-medium text-gray-900 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  {phone ? 'Edit' : 'Add'}
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200">
              <div className="font-bold text-gray-900 text-sm mb-3">Update your mobile number</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-full sm:max-w-xs">
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    onValidationChange={setIsPhoneValid}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleSavePhone} 
                    disabled={isSaving || !isPhoneValid} 
                    className="px-5 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-xs font-medium text-gray-900 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingPhone(false)
                      setPhone(userData?.phone || sessionUser.phone || '')
                    }} 
                    className="px-5 py-1.5 bg-white border border-gray-300 rounded-sm text-xs font-medium text-gray-900 hover:bg-gray-50 shadow-sm transition-colors"
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