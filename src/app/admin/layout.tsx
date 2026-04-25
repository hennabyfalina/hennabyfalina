// src/app/admin/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu, X, Store, Tags, Boxes } from 'lucide-react'
import { siteConfig } from '@/config/site'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showLeaveAdminConfirm, setShowLeaveAdminConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      setCheckingAdmin(true)
      const supabase = createClient()
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login?redirect=/admin')
          return
        }

        // 🔒 Use maybeSingle() to avoid errors
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching user role:', error)
          router.push('/')
          return
        }

        if (userData?.role !== 'admin') {
          router.push('/')
          return
        }

        setUserEmail(session.user.email || '')
        setIsAdmin(true)
      } catch (error) {
        console.error('Admin check error:', error)
        router.push('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [router])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const confirmLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setShowLogoutConfirm(false)
    setLoggingOut(false)
    router.push('/')
    router.refresh()
  }

  // 🔒 Show loading state while checking admin
  if (checkingAdmin || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-full bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out z-50
          ${isSidebarOpen ? 'w-64' : 'w-[72px]'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 mt-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
              isSidebarOpen ? 'ml-3 opacity-100 w-auto' : 'w-0 opacity-0 ml-0'
            }`}
          >
          <span className="text-base font-semibold tracking-tight text-gray-900 whitespace-nowrap">{siteConfig.shortName} Admin</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-full transition-colors relative group
                  ${isActive
                    ? 'bg-blue-100/50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                  }
                  ${!isSidebarOpen ? 'justify-center' : 'justify-start'}
                `}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    isSidebarOpen ? 'ml-3 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 mb-2 space-y-1.5">
          <button
            onClick={() => setShowLeaveAdminConfirm(true)}
            className={`
              flex items-center px-3 py-2.5 w-full rounded-full text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 transition-colors
              ${!isSidebarOpen ? 'justify-center' : 'justify-start'}
            `}
            title={!isSidebarOpen ? "View Store" : undefined}
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isSidebarOpen ? 'ml-3 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'
              }`}
            >
              View Store
            </span>
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`
              flex items-center px-3 py-2.5 w-full rounded-full text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors
              ${!isSidebarOpen ? 'justify-center' : 'justify-start'}
            `}
            title={!isSidebarOpen ? "Sign out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isSidebarOpen ? 'ml-3 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'
              }`}
            >
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-[72px]'}`}>
        
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center">
          <span className="text-lg font-semibold tracking-tight text-gray-900">{siteConfig.shortName} Admin</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-center justify-between px-2 py-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors
                  ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                  }
                `}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-blue-100/50' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
          >
            <div className="p-1 rounded-full bg-transparent">
              <Menu className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-8 safe-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Admin Options</h3>
                {userEmail && <p className="text-sm text-gray-500 mt-1">{userEmail}</p>}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {navItems.slice(4).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors font-medium ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    {item.label}
                  </Link>
                )
              })}

              <div className="h-px bg-gray-200 my-1" />

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setShowLeaveAdminConfirm(true)
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-900 font-medium"
              >
                <Store className="w-5 h-5 text-gray-500" />
                View Storefront
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setShowLogoutConfirm(true)
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors text-red-700 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Admin Confirmation Modal */}
      {showLeaveAdminConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLeaveAdminConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-5 md:p-8 w-full max-w-[320px] md:max-w-sm">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 mb-1.5 md:mb-2">Leave Admin Area</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">Are you sure you want to leave the admin area and return to the storefront?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveAdminConfirm(false)}
                className="flex-1 py-2.5 md:py-3 px-4 border border-gray-200 rounded-xl text-sm md:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeaveAdminConfirm(false)
                  router.push('/')
                }}
                className="flex-1 py-2.5 md:py-3 px-4 bg-gray-900 text-white rounded-xl text-sm md:text-base font-medium hover:bg-gray-800 transition-colors"
              >
                View Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-5 md:p-8 w-full max-w-[320px] md:max-w-sm">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 mb-1.5 md:mb-2">Sign out</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 md:py-3 px-4 border border-gray-200 rounded-xl text-sm md:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 py-2.5 md:py-3 px-4 bg-red-600 text-white rounded-xl text-sm md:text-base font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}