// src/components/admin/layout/AdminSidebar.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Store, LogOut, PanelLeftClose, PanelLeftOpen, LayoutDashboard } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { ADMIN_NAV_ITEMS } from '@/config/admin'
import { useAuth } from '@/hooks/useAuth'

interface AdminSidebarProps {
  pathname: string
  isSidebarOpen: boolean
  setIsSidebarOpen: (val: boolean) => void
  onLeaveAdmin: () => void
  onSignOut: () => void
}

export default function AdminSidebar({ pathname, isSidebarOpen, setIsSidebarOpen, onLeaveAdmin, onSignOut }: AdminSidebarProps) {
  const { isSuperAdmin } = useAuth()

  // ✅ Filter nav items based on role (hide finance from regular admins, but keep Appearance)
const filteredNavItems = ADMIN_NAV_ITEMS.filter(item => {
  if (isSuperAdmin) return true;
  // For regular admins: hide Finance and anything else you don't want
  const lowerHref = item.href.toLowerCase();
  if (lowerHref === '/admin/finance') return false;   // 👈 hide finance
  if (lowerHref === '/admin/settings') return true;   // keep settings
  if (lowerHref.includes('users')) return false;      // hide users
  return true;
});


  return (
    <aside
      className={`
        hidden md:flex flex-col absolute top-0 left-0 h-full admin-bg-primary
        transition-[width] duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-50
        ${isSidebarOpen ? 'w-[280px]' : 'w-[76px]'}
      `}
    >
      <div className="shrink-0 h-[76px] flex items-center pt-3 px-4 relative">
        <div 
          className={`flex items-center transition-all duration-500 ease-in-out cursor-pointer group/logo ${isSidebarOpen ? 'translate-x-0' : 'translate-x-1'}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {!isSidebarOpen ? (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-contain flex-shrink-0 transition-all duration-500 scale-110 group-hover/logo:opacity-0"
              />
              <PanelLeftOpen className="w-6 h-6 absolute inset-0 m-auto opacity-0 group-hover/logo:opacity-100 admin-text-secondary transition-all duration-300 scale-75 group-hover/logo:scale-100" />
            </div>
          ) : (
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8 object-contain flex-shrink-0 transition-all duration-500 scale-100 hover:opacity-80"
            />
          )}
        </div>
        
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className={`ml-auto p-2 rounded-xl hover:admin-bg-elevated transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer active:scale-95 flex items-center justify-center ${!isSidebarOpen ? 'opacity-0 pointer-events-none -translate-x-4 scale-75' : 'opacity-100 translate-x-0 scale-100'}`}
        >
          <PanelLeftClose className="w-6 h-6 admin-text-secondary" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain no-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.includes(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-3 rounded-full transition-all duration-300 cursor-pointer group
                ${isActive ? 'admin-bg-elevated admin-text-primary' : 'hover:admin-bg-elevated/30 admin-text-secondary'}
                ${!isSidebarOpen ? 'justify-center px-0' : 'justify-start'}
              `}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-125 group-active:scale-95 ${isActive ? 'admin-text-accent' : 'admin-text-secondary group-hover:admin-text-accent'}`} />
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'ml-4 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}