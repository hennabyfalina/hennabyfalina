// src/components/admin/layout/AdminMobileNav.tsx

'use client'

import Link from 'next/link'
import { Menu, X, Store, LogOut } from 'lucide-react'
import { ADMIN_NAV_ITEMS } from '@/config/admin'

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
  return (
    <>
      {/* 🚨 GEMINI FLOATING CURVED NAV 🚨 */}
      <nav className="md:hidden fixed bottom-5 left-4 right-4 z-40 bg-[#1E1F20]/95 backdrop-blur-xl border border-[#333538] rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around px-2 py-2">
          {ADMIN_NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname.includes(item.href)
            return (
              <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center justify-center gap-1 transition-all">
                <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-[#282A2C] text-[#A8C7FA]' : 'text-[#C4C7C5]'}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] ${isActive ? 'text-[#A8C7FA] font-medium' : 'text-[#C4C7C5] font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-1 transition-all cursor-pointer text-[#C4C7C5]">
            <div className="p-1.5 rounded-full transition-colors">
              <Menu className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full bg-[#1E1F20] rounded-t-[32px] shadow-2xl p-6 pb-8 safe-bottom animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-medium text-[#E3E3E3]">Menu</h3>
                <p className="text-xs font-mono text-[#A8C7FA] mt-1">{maskedEmail}</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-full bg-[#282A2C] hover:bg-[#333538] text-[#E3E3E3] cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {ADMIN_NAV_ITEMS.slice(4).map((item) => {
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
              <button onClick={() => { setIsMobileMenuOpen(false); onLeaveAdmin(); }} className="w-full flex items-center gap-4 p-4 rounded-full hover:bg-[#282A2C]/50 text-[#C4C7C5] font-medium cursor-pointer transition-colors">
                <Store className="w-5 h-5" /> Return to Storefront
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); onSignOut(); }} className="w-full flex items-center gap-4 p-4 rounded-full hover:bg-[#3C1E0A] text-[#F9AB00] font-medium cursor-pointer transition-colors">
                <LogOut className="w-5 h-5" /> Secure Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}