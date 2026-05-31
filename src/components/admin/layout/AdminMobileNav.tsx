// src/components/admin/layout/AdminMobileNav.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Store, LogOut } from 'lucide-react'
import { ADMIN_NAV_ITEMS } from '@/config/admin'
import { useAuth } from '@/hooks/useAuth'

interface AdminMobileNavProps {
  pathname: string
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (val: boolean) => void
  maskedEmail: string
  onLeaveAdmin: () => void
  onSignOut: () => void
}

export default function AdminMobileNav({
  pathname,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  maskedEmail,
  onLeaveAdmin,
  onSignOut
}: AdminMobileNavProps) {
  const { isSuperAdmin } = useAuth()

  // ✅ Filter nav items based on role (hide Settings & Users from regular admins, but keep Appearance)
  const filteredNavItems = ADMIN_NAV_ITEMS.filter(item => {
    if (isSuperAdmin) return true
    const lowerHref = item.href.toLowerCase()
    if (lowerHref === '/admin/settings') {
      return true
    }
    if (lowerHref.includes('users')) return false
    return true
  })

  // Bottom bar uses first 4 items from filtered list
  const bottomItems = filteredNavItems.slice(0, 4)
  // Remaining items go to the drawer
  const drawerItems = filteredNavItems.slice(4)

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 z-40 admin-bg-card border admin-border rounded-[32px]">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.includes(item.href)
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center justify-center gap-1 transition-all">
                <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'admin-bg-elevated admin-text-accent' : 'admin-text-secondary'}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] ${isActive ? 'admin-text-accent font-medium' : 'admin-text-secondary font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-1 transition-all cursor-pointer">
            <div className={`p-1.5 rounded-full transition-colors ${isMobileMenuOpen || drawerItems.some(item => pathname.includes(item.href)) ? 'admin-bg-elevated admin-text-accent' : 'admin-text-secondary'}`}>
              <Menu className="w-5 h-5" strokeWidth={isMobileMenuOpen || drawerItems.some(item => pathname.includes(item.href)) ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium ${isMobileMenuOpen || drawerItems.some(item => pathname.includes(item.href)) ? 'admin-text-accent' : 'admin-text-secondary'}`}>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full admin-bg-card rounded-t-[32px] shadow-2xl p-6 pb-8 safe-bottom animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Avatar ring */}
                <div
                  className="relative flex p-[2px] rounded-full items-center justify-center"
                  style={{ background: 'conic-gradient(from 0deg, #4285F4 0% 25%, #EA4335 25% 50%, #FBBC05 50% 75%, #34A853 75% 100%)' }}
                >
                  <div className="w-10 h-10 rounded-full admin-bg-primary flex items-center justify-center border-[1.5px] admin-border bg-white overflow-hidden">
                    <Image 
                      src="/logo.png" 
                      alt="Admin" 
                      width={24} 
                      height={24} 
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                </div>
                <div>
                <h3 className="text-xl font-medium admin-text-primary">Menu</h3>
                <p className="text-xs font-mono admin-text-accent mt-1">{maskedEmail}</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-full admin-bg-elevated hover:bg-[#333538] admin-text-primary cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {drawerItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname.includes(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex flex-col items-center justify-center p-5 rounded-[24px] transition-colors border ${isActive ? 'admin-bg-elevated border-[#A8C7FA]/30 admin-text-accent' : 'admin-bg-primary hover:admin-bg-elevated border admin-border admin-text-secondary'}`}>
                    <Icon className="w-6 h-6 mb-3" /> 
                    <span className="text-[11px] font-bold uppercase tracking-wider text-center">{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t admin-border">
              <button onClick={() => { setIsMobileMenuOpen(false); onLeaveAdmin(); }} className="w-full flex items-center gap-4 p-4 rounded-full hover:bg-[#282A2C]/50 admin-text-secondary font-medium cursor-pointer transition-colors">
                <Store className="w-5 h-5" /> Return to Storefront
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); onSignOut(); }} className="w-full flex items-center gap-4 p-4 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium cursor-pointer transition-colors">
                <LogOut className="w-5 h-5" /> Secure Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}