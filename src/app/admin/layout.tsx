// src/app/admin/layout.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu, Store, Tags, AlertTriangle,
  Boxes, Search, ShieldAlert, IndianRupee, X, RefreshCw, Lock
} from 'lucide-react'
import { siteConfig } from '@/config/site'
import AdminLoader from '@/components/admin/AdminLoader'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import AdminCommandPalette from '@/components/admin/AdminCommandPalette'
import AdminRealtimeNotifier from '@/components/admin/AdminRealtimeNotifier'
import Toaster from '@/components/ui/Toast'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'super_admin'] },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'super_admin'] },
  { href: '/admin/products', label: 'Products', icon: Package, roles: ['admin', 'super_admin'] },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'super_admin'] },
  { href: '/admin/categories', label: 'Categories', icon: Tags, roles: ['admin', 'super_admin'] },
  { href: '/admin/customers', label: 'Customers', icon: Users, roles: ['admin', 'super_admin'] },
  { href: '/admin/finance', label: 'Finance', icon: IndianRupee, roles: ['admin', 'super_admin'] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useIdleTimeout(30) // Auto-logout after 30 minutes of inactivity

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#131314'
    document.documentElement.style.backgroundColor = '#131314'
    document.body.style.overscrollBehavior = 'auto'
    document.documentElement.style.overscrollBehavior = 'auto'

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
        // Allow both 'admin' and 'super_admin'
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

    return () => {
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
      document.body.style.overscrollBehavior = 'auto'
      document.documentElement.style.overscrollBehavior = 'auto'
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    try {
      await fetch('/api/clear-admin-cookie', { method: 'POST' })
      await supabase.auth.signOut()
      
      // 🚨 EXPLICIT CROSS-TAB LOGOUT BROADCAST 🚨
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

  // Filter navigation items based on role
  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(role === 'super_admin' ? 'super_admin' : 'admin')
  )

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#131314] text-[#E3E3E3] flex flex-col md:flex-row font-sans selection:bg-[#A8C7FA]/30 selection:text-white touch-pan-y">
      
      {/* 🚨 ALERT BANNER FOR REGULAR ADMINS (visible in both desktop & mobile) 🚨 */}
      {isAdmin && !isSuperAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#3C1E0A] border-b border-[#4E270D] text-[#F9AB00] text-center py-2.5 px-4 text-xs font-medium flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm whitespace-nowrap overflow-x-auto no-scrollbar">
          <AlertTriangle className="w-4 h-4 text-[#F9AB00]" />
          <span>You are viewing with limited permissions.</span>
          <span className="hidden md:inline">Contact super admin to request full access.</span>
          <button 
            onClick={() => window.open('mailto:admin@razackpackagingcentre.com')}
            className="ml-2 px-3 py-1 bg-[#4E270D] hover:bg-[#6B3A12] rounded-full text-[11px] font-bold transition-colors cursor-pointer"
          >
            Request Access
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-full bg-[#1E1F20] 
          transition-all duration-300 ease-in-out z-50
          ${isSidebarOpen ? 'w-[280px]' : 'w-[76px]'}
          ${isAdmin && !isSuperAdmin ? 'pt-12' : 'pt-0'}
        `}
      >
        <div className="shrink-0 h-[76px] flex items-center px-4 md:px-5 pt-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-full hover:bg-[#282A2C] transition-colors cursor-pointer text-[#C4C7C5] flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.includes(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-4 py-3.5 rounded-full transition-all cursor-pointer
                  ${isActive ? 'bg-[#282A2C] text-[#A8C7FA]' : 'hover:bg-[#282A2C]/50 text-[#C4C7C5]'}
                  ${!isSidebarOpen ? 'justify-center px-0' : 'justify-start'}
                `}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-[#A8C7FA]' : 'text-[#C4C7C5]'}`} />
                <span className={`flex-1 flex items-center justify-between text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'ml-4 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'}`}>
                  <span>{item.label}</span>
                  {!isSuperAdmin && item.href === '/admin/finance' && (
                    <Lock className="w-3.5 h-3.5 text-[#F9AB00] flex-shrink-0" />
                  )}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area (unchanged from original – only sidebar logic changed) */}
      <div className={`flex-1 flex flex-col h-[100dvh] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out touch-pan-y ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[76px]'} ${isAdmin && !isSuperAdmin ? 'pt-12' : 'pt-0'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* 🚨 shrink-0 prevents heavy page content from squishing the header 🚨 */}
        <header className="shrink-0 h-[76px] bg-[#131314] px-6 hidden md:flex items-center justify-between sticky top-0 z-30 pt-3">
          <div className="flex items-center">
            
            <Link href="/admin/dashboard" className="text-xl font-medium tracking-tight text-[#A8C7FA] transition-opacity hover:opacity-80">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Link>
          </div>

          <div className="flex items-center gap-4 relative" ref={profileRef}>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center p-2.5 rounded-full hover:bg-[#282A2C] transition-colors cursor-pointer text-[#C4C7C5]"
              title="Sync Latest Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#A8C7FA]' : ''}`} />
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="flex items-center gap-2 bg-[#1E1F20] hover:bg-[#282A2C] px-4 py-2.5 rounded-full text-[#C4C7C5] transition-colors cursor-pointer mr-2 border border-transparent hover:border-[#333538]"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">Search records...</span>
              <span className="ml-4 text-xs font-mono bg-[#131314] px-1.5 py-0.5 rounded text-[#8E9196] border border-[#333538]">Alt K</span>
            </button>

            {/* Avatar ring */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative flex p-[2.5px] rounded-full cursor-pointer hover:scale-105 transition-transform items-center justify-center"
              style={{ background: 'conic-gradient(from 90deg, #EA4335 0deg 90deg, #4285F4 90deg 180deg, #34A853 180deg 270deg, #FBBC05 270deg 360deg)' }}
            >
              <div className="w-8 h-8 rounded-full bg-[#1E1F20] flex items-center justify-center text-[#E3E3E3] font-medium text-sm border-2 border-[#131314]">
                {initial}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute top-14 right-0 w-72 bg-[#1E1F20] rounded-[28px] border border-[#333538] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
                <p className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest mb-3 px-3">Identity Management</p>
                <div className="bg-[#131314] rounded-2xl p-4 border border-[#333538] mb-4">
                  <p className="text-sm font-bold text-[#E3E3E3]">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
                  <p className="text-xs text-[#8E9196] font-mono mt-1">{getMaskedEmail(userEmail)}</p>
                </div>
                <div className="space-y-1">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#E3E3E3] hover:bg-[#282A2C] rounded-full transition-colors cursor-pointer"
                  >
                    <Store className="w-4 h-4 text-[#A8C7FA]" /> Go to Storefront
                  </a>
                  <button
                    onClick={() => { setIsProfileOpen(false); setShowLogoutConfirm(true); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#F2B8B5] hover:bg-[#4D2628]/40 rounded-full transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
          <div className="max-w-[1150px] mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav (unchanged) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1F20]/95 backdrop-blur-xl border-t border-[#333538] rounded-t-[32px] safe-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pt-2 pb-1">
        <div className="flex items-center justify-around px-2 py-1">
          {filteredNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname.includes(item.href)
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center justify-center gap-1.5 transition-all">
                <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-[#282A2C] text-[#A8C7FA]' : 'text-[#C4C7C5]'}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] ${isActive ? 'text-[#A8C7FA] font-bold' : 'text-[#C4C7C5] font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-1.5 transition-all cursor-pointer">
            <div className={`p-2 rounded-full transition-colors ${isMobileMenuOpen ? 'bg-[#282A2C] text-[#A8C7FA]' : 'text-[#C4C7C5]'}`}>
              <Menu className="w-5 h-5" strokeWidth={isMobileMenuOpen ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] ${isMobileMenuOpen ? 'text-[#A8C7FA] font-bold' : 'text-[#C4C7C5] font-medium'}`}>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer (unchanged) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full bg-[#1E1F20] rounded-t-[32px] shadow-2xl p-6 pb-8 safe-bottom animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-medium text-[#E3E3E3]">More Options</h3>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-full bg-[#282A2C] hover:bg-[#333538] text-[#E3E3E3] cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 🚨 MOBILE IDENTITY BLOCK 🚨 */}
            <div className="bg-[#131314] rounded-2xl p-4 border border-[#333538] mb-6 flex flex-col items-center text-center shadow-inner">
              <p className="text-sm font-bold text-[#E3E3E3] tracking-wide">{isSuperAdmin ? 'Super Admin' : 'Admin'} Workspace</p>
              <p className="text-[11px] text-[#8E9196] font-mono mt-1">{getMaskedEmail(userEmail)}</p>
            </div>

            {/* 🚨 MOBILE GLOBAL SEARCH 🚨 */}
            <button
              onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new CustomEvent('open-command-palette')); }}
              className="w-full flex items-center justify-center gap-3 p-4 mb-6 bg-[#282A2C] text-[#E3E3E3] hover:text-[#A8C7FA] rounded-[24px] transition-colors cursor-pointer shadow-sm border border-[#333538]"
            >
              <Search className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide">Search Workspace...</span>
            </button>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {filteredNavItems.slice(4).map((item) => {
                const Icon = item.icon
                const isActive = pathname.includes(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex flex-col items-center justify-center p-5 rounded-[24px] transition-colors border ${isActive ? 'bg-[#282A2C] border-[#A8C7FA]/30 text-[#A8C7FA]' : 'bg-[#131314] hover:bg-[#282A2C] border-[#333538] text-[#C4C7C5]'}`}>
                    <Icon className="w-6 h-6 mb-3" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-center flex items-center gap-1.5">
                      {item.label}
                      {!isSuperAdmin && item.href === '/admin/finance' && (
                        <Lock className="w-3 h-3 text-[#F9AB00]" />
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-[#333538]">
              <a href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-[#282A2C]/50 text-[#C4C7C5] font-medium cursor-pointer transition-colors">
                <Store className="w-5 h-5" /> Return to Storefront
              </a>
              <button onClick={() => { setIsMobileMenuOpen(false); setShowLogoutConfirm(true); }} className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-[#4D2628]/40 text-[#F2B8B5] font-medium cursor-pointer transition-colors">
                <LogOut className="w-5 h-5" /> Secure Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

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