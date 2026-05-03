// src/app/admin-gate/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { verifyAdminGate } from '@/app/actions/verify-admin-gate'
import Link from 'next/link'
import { signOut } from '@/services/auth.service'
import { ShieldCheck, Lock, LogOut } from 'lucide-react'
import { siteConfig } from '@/config/site'

// 🚨 Reusing our Elite UI Components
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import AdminLoader from '@/components/admin/AdminLoader'
import { showToast } from '@/components/ui/Toast'

export default function AdminGatePage() {
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Force dark mode for the gate
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, isLoading, router])

  if (isLoading) {
    return <AdminLoader fullScreen={true} message="Verifying session..." />
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
  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'A'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      showToast('Please enter the administrative access code.', 'warning')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await verifyAdminGate(code)
      
      if (response.success) {
        document.cookie = `admin_gate_passed=true; path=/; max-age=${8 * 60 * 60}; SameSite=Lax; Secure`
        showToast('Access granted. Initializing workspace...', 'success')
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 1000)
      } else {
        showToast(response.error || 'Invalid access code. Please try again.', 'error')
        setSubmitting(false)
        setCode('') // Clear the input field on error for quick retry
      }
    } catch (err) {
      showToast('An error occurred while verifying the code.', 'error')
      setSubmitting(false)
    }
  }

  const confirmLogout = async () => {
    setLoggingOut(true)
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#131314] text-[#E3E3E3] selection:bg-[#A8C7FA]/30 selection:text-white p-4">
      
      {/* 🚨 GEMINI LOGIN CARD 🚨 */}
      <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Header / Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="text-2xl font-medium tracking-tight text-[#E3E3E3] hover:text-[#A8C7FA] transition-colors mb-1">
            {siteConfig.shortName || siteConfig.name}
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1E1F20] border border-[#333538] rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A8C7FA]" />
            <span className="text-[10px] font-bold text-[#A8C7FA] tracking-widest uppercase">Secure Gateway</span>
          </div>
        </div>

        {/* Main Verification Card */}
        <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#A8C7FA]/5 blur-3xl rounded-full pointer-events-none" />

          {/* Profile Section */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            {/* Google 4-Color Avatar Ring */}
            <div 
              className="relative p-[3px] rounded-full mb-4 shadow-lg shadow-black/50"
              style={{ background: 'conic-gradient(from 90deg, #EA4335 0deg 90deg, #4285F4 90deg 180deg, #34A853 180deg 270deg, #FBBC05 270deg 360deg)' }}
            >
              <div className="w-16 h-16 rounded-full bg-[#131314] flex items-center justify-center text-[#E3E3E3] font-medium text-2xl border-4 border-[#1E1F20]">
                {initial}
              </div>
            </div>
            
            <h1 className="text-2xl font-normal text-[#E3E3E3] tracking-tight mb-1">Verify it's you</h1>
            <div className="flex items-center justify-center gap-2 text-[#C4C7C5] bg-[#131314] px-4 py-1.5 rounded-full border border-[#333538] mt-2">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-sm font-mono tracking-tight">{maskedEmail}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <div className="relative group">
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={submitting}
                  autoComplete="off"
                  autoFocus
                  placeholder="Enter administrative code"
                  className="w-full px-5 py-4 bg-[#131314] border border-[#333538] text-[#E3E3E3] placeholder:text-[#8E9196] rounded-[24px] focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all text-center tracking-widest font-mono text-lg disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || code.length === 0}
                className="w-full py-4 text-sm font-bold text-white bg-[#0B57D0] rounded-full hover:bg-[#0842A0] transition-all cursor-pointer shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Access Workspace'
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                disabled={submitting}
                className="w-full py-4 bg-transparent border border-[#333538] hover:bg-[#282A2C] text-[#C4C7C5] rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Not your account? Sign out
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-[#8E9196] hover:text-[#E3E3E3] transition-colors">Conditions</Link>
            <Link href="/privacy" className="text-xs text-[#8E9196] hover:text-[#E3E3E3] transition-colors">Privacy</Link>
            <Link href="/help" className="text-xs text-[#8E9196] hover:text-[#E3E3E3] transition-colors">Help</Link>
          </div>
          <p className="text-[11px] text-[#565959] font-mono">
            &copy; {new Date().getFullYear()} {siteConfig.name} Workspace
          </p>
        </div>
      </div>

      {/* 🚨 REUSABLE ELITE LOGOUT MODAL 🚨 */}
      <AdminConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out of Gateway?"
        description="Are you sure you want to cancel authentication and sign out of this account?"
        confirmText="Sign Out"
        icon={<LogOut className="w-6 h-6" />}
        isDestructive={true}
        isLoading={loggingOut}
      />
      
    </div>
  )
}