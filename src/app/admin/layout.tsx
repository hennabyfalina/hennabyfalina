// src/app/admin/layout.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu, Store, Tags, Boxes, Search, ShieldAlert, IndianRupee, X, RefreshCw } from 'lucide-react'
import { siteConfig } from '@/config/site'
import AdminLoader from '@/components/admin/AdminLoader'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import AdminCommandPalette from '@/components/admin/AdminCommandPalette'
import Toaster from '@/components/ui/Toast'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/finance', label: 'Finance', icon: IndianRupee },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 🚨 2-Step Sign Out States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add('dark')

    // 🚨 Prevent mobile overscroll bouncing and white background flashes
    document.body.style.backgroundColor = '#131314'
    document.documentElement.style.backgroundColor = '#131314'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'

    const checkAdmin = async () => {
      setCheckingAdmin(true)
      const supabase = createClient()
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login?redirect=/admin'); return }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error || userData?.role !== 'admin') { router.push('/'); return }

        setUserEmail(session.user.email || '')
        setIsAdmin(true)
      } catch (error) {
        router.push('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()

    // Cleanup to not affect the storefront when navigating away
    return () => {
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
      document.body.style.overscrollBehavior = ''
      document.documentElement.style.overscrollBehavior = ''
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

  return (
    <div className="h-[100dvh] w-full overflow-hidden overscroll-none bg-[#131314] text-[#E3E3E3] flex flex-col md:flex-row font-sans selection:bg-[#A8C7FA]/30 selection:text-white">
      
      {/* 🚨 GEMINI FULL-HEIGHT SIDEBAR 🚨 */}
      <aside
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-full bg-[#1E1F20] 
          transition-all duration-300 ease-in-out z-50
          ${isSidebarOpen ? 'w-[280px]' : 'w-[76px]'}
        `}
      >
        {/* Toggle Button Container - Exactly where Gemini puts it */}
        <div className="h-16 flex items-center px-4 md:px-5">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2.5 rounded-full hover:bg-[#282A2C] transition-colors cursor-pointer text-[#C4C7C5] flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
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
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'ml-4 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 🚨 MAIN CONTENT AREA 🚨 */}
      <div className={`flex-1 flex flex-col h-[100dvh] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[76px]'}`}>
        
        {/* 🚨 GEMINI MAIN HEADER 🚨 */}
        <header className="h-16 bg-[#131314] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 pt-1">
          
          {/* Left: Site Branding (Aligns perfectly next to the sidebar) */}
          <div className="flex items-center">
            {/* Mobile Hamburger (Hidden as requested) */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="hidden p-2.5 mr-2 rounded-full hover:bg-[#282A2C] transition-colors cursor-pointer text-[#C4C7C5]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/admin/dashboard" className="text-xl font-medium tracking-tight text-[#A8C7FA] transition-opacity hover:opacity-80">
              Admin
            </Link>
          </div>

          {/* Right: Search & Profile */}
          <div className="flex items-center gap-4 relative" ref={profileRef}>
            {/* Refresh Sync Button */}
            <button 
              onClick={handleRefresh}
              className="p-2.5 rounded-full hover:bg-[#282A2C] transition-colors cursor-pointer text-[#C4C7C5]"
              title="Sync Latest Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#A8C7FA]' : ''}`} />
            </button>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="hidden lg:flex items-center gap-2 bg-[#1E1F20] hover:bg-[#282A2C] px-4 py-2.5 rounded-full text-[#C4C7C5] transition-colors cursor-pointer mr-2 border border-transparent hover:border-[#333538]"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">Search records...</span>
              <span className="ml-4 text-xs font-mono bg-[#131314] px-1.5 py-0.5 rounded text-[#8E9196] border border-[#333538]">Alt K</span>
            </button>

            {/* Avatar Ring */}
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative p-[2.5px] rounded-full cursor-pointer hover:scale-105 transition-transform"
              style={{ background: 'conic-gradient(from 90deg, #EA4335 0deg 90deg, #4285F4 90deg 180deg, #34A853 180deg 270deg, #FBBC05 270deg 360deg)' }}
            >
              <div className="w-8 h-8 rounded-full bg-[#1E1F20] flex items-center justify-center text-[#E3E3E3] font-medium text-sm border-2 border-[#131314]">
                {initial}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-14 right-0 w-72 bg-[#1E1F20] rounded-[28px] border border-[#333538] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
                <p className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest mb-3 px-3">Identity Management</p>
                <div className="bg-[#131314] rounded-2xl p-4 border border-[#333538] mb-4">
                  <p className="text-sm font-bold text-[#E3E3E3]">Admin</p>
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

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
          <div className="max-w-[1150px] mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* 🚨 GEMINI MOBILE CURVED NAV 🚨 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1F20]/95 backdrop-blur-xl border-t border-[#333538] rounded-t-[32px] safe-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pt-2 pb-1">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.slice(0, 4).map((item) => {
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

      {/* 🚨 MOBILE MENU DRAWER 🚨 */}
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
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {navItems.slice(4).map((item) => {
                const Icon = item.icon
                const isActive = pathname.includes(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex flex-col items-center justify-center p-5 rounded-[24px] transition-colors border ${isActive ? 'bg-[#282A2C] border-[#A8C7FA]/30 text-[#A8C7FA]' : 'bg-[#131314] hover:bg-[#282A2C] border-[#333538] text-[#C4C7C5]'}`}>
                    <Icon className="w-6 h-6 mb-3" /> 
                    <span className="text-[11px] font-bold uppercase tracking-wider text-center">{item.label}</span>
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

      {/* 🚨 ELITE 2-STEP SECURE LOGOUT 🚨 */}
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
      <Toaster />
    </div>
  )
}