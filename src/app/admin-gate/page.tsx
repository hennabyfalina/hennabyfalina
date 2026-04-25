// src/app/admin-gate/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { verifyAdminGate } from '@/app/actions/verify-admin-gate'
import Link from 'next/link'
import { signOut } from '@/services/auth.service'
import { ShieldCheck, AlertTriangle, Lock, LogOut, CheckCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function AdminGatePage() {
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#D5D9D9] border-t-[#E77600] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin || !user) {
    return null
  }

  // Extreme email masking for security (e.g. s*****l@g****.com)
  const getMaskedEmail = (email: string) => {
    if (!email) return ''
    const [name, domain] = email.split('@')
    if (!domain) return email
    
    const maskedName = name.charAt(0) + '*****' + (name.length > 2 ? name.charAt(name.length - 1) : '')
    const domainParts = domain.split('.')
    const ext = domainParts.pop()
    const main = domainParts.join('.')
    const maskedMain = main.charAt(0) + '****'
    
    return `${maskedName}@${maskedMain}.${ext}`
  }

  const maskedEmail = getMaskedEmail(user.email || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!code.trim()) {
      setError('Please enter the administrative access code.')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await verifyAdminGate(code)
      
      if (response.success) {
        setSuccess('Access granted. Redirecting to dashboard...')
        // Small delay to show the success message before redirecting
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 1000)
      } else {
        // Display the specific error message returned from the server action
        setError(response.error || 'Invalid access code. Please try again.')
        setSubmitting(false)
        setCode('') // Clear the input field on error
      }
    } catch (err) {
      setError('An error occurred while verifying the code.')
      setSubmitting(false)
    }
  }

  const confirmLogout = async () => {
    setLoggingOut(true)
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Amazon Style Header */}
      <header className="w-full py-4 flex items-center justify-center border-b border-[#D5D9D9]">
        <div className="flex flex-col items-center">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-[#0F1111] hover:opacity-90 transition-opacity">
            {siteConfig.name}
          </Link>
          <span className="text-sm font-medium text-[#565959] mt-0.5 tracking-wide uppercase">Seller Central</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col pt-8 pb-12 px-4 w-full max-w-[400px] mx-auto">
        
        {/* Error Alert Box */}
        {error && (
          <div className="mb-4 p-4 border-l-4 border-[#B12704] border border-[#D5D9D9] rounded-sm bg-white shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#B12704] flex-shrink-0" />
              <div>
                <h3 className="text-[#B12704] font-bold text-sm mb-1">There was a problem</h3>
                <p className="text-sm text-[#0F1111]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert Box */}
        {success && (
          <div className="mb-4 p-4 border-l-4 border-[#007600] border border-[#D5D9D9] rounded-sm bg-white shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-[#007600] flex-shrink-0" />
              <div>
                <h3 className="text-[#007600] font-bold text-sm mb-1">Authentication Successful</h3>
                <p className="text-sm text-[#0F1111]">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Verification Card */}
        <div className="border border-[#D5D9D9] rounded-sm p-6 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#007185]" strokeWidth={1.5} />
            <h1 className="text-2xl font-normal text-[#0F1111] tracking-tight">Two-Step Verification</h1>
          </div>

          <p className="text-sm text-[#0F1111] mb-4">
            For added security, please enter the administrative access code to enter Seller Central.
          </p>

          <div className="bg-[#F0F2F2] border border-[#D5D9D9] rounded-sm p-3 mb-5 flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#565959]" />
            <div className="flex flex-col">
              <span className="text-xs text-[#565959] font-bold uppercase tracking-wide">Authenticating as</span>
              <span className="text-sm font-medium text-[#0F1111]">{maskedEmail}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#0F1111] mb-1">Enter access code</label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={submitting || !!success}
                autoComplete="off"
                autoFocus
                placeholder="••••••••"
                title="Administrative access code"
                className="w-full px-3 py-2 bg-white border border-[#D5D9D9] rounded-sm focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600] transition-shadow text-sm tracking-widest font-mono disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length === 0 || !!success}
              className="w-full py-2.5 mt-2 text-sm font-normal text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#007185] focus:outline-none"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Sign-In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#D5D9D9]">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              disabled={submitting || !!success}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#D5D9D9] hover:bg-gray-50 rounded-sm text-sm font-medium text-[#0F1111] shadow-sm transition-colors focus:ring-2 focus:ring-[#007185] focus:outline-none disabled:opacity-50"
            >
              Not your account? Sign out
            </button>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#F0F2F2] py-8 border-t border-[#D5D9D9] mt-auto">
        <div className="flex justify-center items-center gap-6 mb-4 flex-wrap px-4">
          <Link href="/terms" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Conditions of Use</Link>
          <Link href="/privacy" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Privacy Notice</Link>
          <Link href="/help" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Help</Link>
        </div>
        <p className="text-xs text-[#565959] text-center">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </footer>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-sm shadow-[0_4px_14px_rgba(0,0,0,0.15)] max-w-sm w-full p-6 border border-[#D5D9D9] animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <LogOut className="w-5 h-5 text-[#B12704]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F1111] mb-2">Sign out</h3>
                <p className="text-sm text-[#565959] leading-relaxed mb-6">
                  Are you sure you want to cancel authentication and sign out of your account?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#D5D9D9]">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="px-5 py-2 text-sm font-medium text-[#0F1111] bg-white border border-[#D5D9D9] rounded-sm hover:bg-gray-50 shadow-sm transition-colors focus:ring-2 focus:ring-[#007185] focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="px-5 py-2 text-sm font-medium text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-colors disabled:opacity-50 focus:ring-2 focus:ring-[#007185] focus:outline-none flex items-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin"></div>
                    Signing out...
                  </>
                ) : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}