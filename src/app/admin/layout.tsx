// src/app/admin/layout.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'
import AdminLoader from '@/components/admin/AdminLoader'
import AdminAlertBanner from '@/components/admin/layout/AdminAlertBanner'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminMobileNav from '@/components/admin/layout/AdminMobileNav'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import AdminCommandPalette from '@/components/admin/AdminCommandPalette'
import AdminRealtimeNotifier from '@/components/admin/AdminRealtimeNotifier'
import Toaster from '@/components/ui/Toast'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'
import { useAdminThemeStore } from '@/store/theme.store'
import { useThemeObserver } from '@/hooks/useThemeObserver'
import { ShieldAlert } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useIdleTimeout(30)
  const { theme } = useAdminThemeStore()
  useThemeObserver()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      setCheckingAdmin(true)
      const supabase = createClient()

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login?next=/admin'); return }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        const userRole = userData?.role
        if (error || (userRole !== 'admin' && userRole !== 'super_admin')) {
          router.push('/')
          return
        }

        setRole(userRole)
        setIsAdmin(true)
        setUserEmail(session.user.email || '')
      } catch (error) {
        router.push('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    try {
      await fetch('/api/clear-admin-cookie', { method: 'POST' })
      await supabase.auth.signOut()
      
      if (typeof window !== 'undefined') {
        try {
          const bc = new BroadcastChannel('auth-sync')
          bc.postMessage({ type: 'LOGOUT' })
          bc.close()
        } catch(e) {}
        try { localStorage.setItem('logout_event', Date.now().toString()) } catch(e) {}
      }
      router.push('/')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getMaskedEmail = (email: string) => {
    if (!email) return 'A****@****.com'
    const [name, domain] = email.split('@')
    return `${name.charAt(0)}********@${domain}`
  }

  if (checkingAdmin || isAdmin === null) return <AdminLoader fullScreen={true} />
  if (!isAdmin) return null

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'A'
  const isSuperAdmin = role === 'super_admin'

  return (
    <div className={`h-[100dvh] w-full overflow-hidden admin-bg-primary admin-text-primary flex flex-col font-sans selection:bg-[#A8C7FA]/30 selection:text-white touch-pan-y admin-theme-${theme}`}>
      
      {/* Alert Banner - Extracted Component */}
      <AdminAlertBanner isSuperAdmin={isSuperAdmin} />

      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* Sidebar - Extracted Component */}
        <AdminSidebar 
          pathname={pathname}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onLeaveAdmin={() => window.location.href = '/'}
          onSignOut={() => setShowLogoutConfirm(true)}
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out touch-pan-y ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[76px]'}`}>
          
          {/* Header - Extracted Component */}
          <AdminHeader 
            isSuperAdmin={isSuperAdmin}
            userEmail={userEmail}
            initial={initial}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onSignOut={() => setShowLogoutConfirm(true)}
          />

          <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
            <div className="max-w-[1150px] mx-auto animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Navigation - Extracted Component */}
      <AdminMobileNav 
        pathname={pathname}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        maskedEmail={getMaskedEmail(userEmail)}
        onLeaveAdmin={() => window.location.href = '/'}
        onSignOut={() => setShowLogoutConfirm(true)}
      />

      {/* Modals and Utilities */}
      <AdminConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Secure Sign Out?"
        description="This will terminate your administrative session and lock the factory workspace. You will need to re-verify your access code to return."
        confirmText="Sign Out Now"
        icon={<ShieldAlert className="w-6 h-6" />}
        isDestructive={true}
        isLoading={isLoggingOut}
      />

      <AdminCommandPalette />
      <AdminRealtimeNotifier />
      <Toaster />
    </div>
  )
}