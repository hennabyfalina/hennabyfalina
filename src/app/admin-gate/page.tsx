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
import Image from 'next/image'
import { useAdminThemeStore } from '@/store/theme.store'

import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import AdminLoader from '@/components/admin/AdminLoader'
import { showToast } from '@/components/ui/Toast'

export default function AdminGatePage() {
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const { theme } = useAdminThemeStore()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Apply theme from store to match admin panel
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('admin-theme-light')
      document.documentElement.classList.remove('admin-theme-dark')
      document.body.style.backgroundColor = 'var(--admin-bg-primary)'
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.add('admin-theme-dark')
      document.documentElement.classList.remove('admin-theme-light')
      document.body.style.backgroundColor = 'var(--admin-bg-primary)'
    }
  }, [theme])

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
    
    if (!code.trim()) {
      showToast('Please enter the administrative access code.', 'warning')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await verifyAdminGate(code)
      
      if (response.success) {
        showToast('Access granted. Initializing workspace...', 'success')
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 1000)
      } else {
        showToast(response.error || 'Invalid access code. Please try again.', 'error')
        setSubmitting(false)
        setCode('')
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
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 admin-bg-primary admin-text-primary selection:bg-[#A8C7FA]/30 selection:text-white admin-theme-${theme}`}>
      
      <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Header / Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="text-2xl font-medium tracking-tight admin-text-primary hover:admin-text-accent transition-colors mb-1">
            {siteConfig.shortName || siteConfig.name}
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 admin-bg-card border admin-border rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 admin-text-accent" />
            <span className="text-[10px] font-bold admin-text-accent tracking-widest uppercase">Secure Gateway</span>
          </div>
        </div>

        {/* Main Verification Card */}
        <div className="admin-bg-card border admin-border rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 admin-text-accent/5 blur-3xl rounded-full pointer-events-none" />

          {/* Profile Section */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            {/* Google 4-Color Avatar Ring */}
            <div 
              className="relative p-[2.5px] rounded-full mb-4 shadow-lg shadow-black/20"
              style={{ background: 'conic-gradient(from 90deg, #EA4335 0deg 90deg, #4285F4 90deg 180deg, #34A853 180deg 270deg, #FBBC05 270deg 360deg)' }}
            >
              <div className="w-16 h-16 rounded-full admin-bg-primary flex items-center justify-center border-[3px] admin-border bg-white overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={40} 
                  height={40} 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-normal admin-text-primary tracking-tight mb-1">Verify it&apos;s you</h1>
            <div className="flex items-center justify-center gap-2 admin-text-secondary admin-bg-primary px-4 py-1.5 rounded-full border admin-border mt-2">
              <Lock className="w-3.5 h-3.5 admin-text-muted" />
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
                  className="w-full px-5 py-4 admin-bg-primary border admin-border admin-text-primary placeholder:admin-text-muted rounded-[24px] focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all text-center tracking-widest font-mono text-lg disabled:opacity-50"
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
                className="w-full py-4 bg-transparent border admin-border admin-text-secondary hover:admin-bg-elevated rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Not your account? Sign out
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs admin-text-muted hover:admin-text-primary transition-colors">Conditions</Link>
            <Link href="/privacy" className="text-xs admin-text-muted hover:admin-text-primary transition-colors">Privacy</Link>
            <Link href="/contact" className="text-xs admin-text-muted hover:admin-text-primary transition-colors">Help</Link>
          </div>
          <p className="text-[11px] text-[#565959] font-mono">
            &copy; {new Date().getFullYear()} {siteConfig.name} Workspace
          </p>
        </div>
      </div>

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