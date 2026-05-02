// src/components/admin/layout/AdminSidebar.tsx

'use client'

import Link from 'next/link'
import { Menu, Store, LogOut } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { ADMIN_NAV_ITEMS } from '@/config/admin'

interface AdminSidebarProps {
  pathname: string
  isSidebarOpen: boolean
  setIsSidebarOpen: (val: boolean) => void
  onLeaveAdmin: () => void
  onSignOut: () => void
}

export default function AdminSidebar({ pathname, isSidebarOpen, setIsSidebarOpen, onLeaveAdmin, onSignOut }: AdminSidebarProps) {
  return (
    <aside
      className={`
        hidden md:flex flex-col fixed top-0 left-0 h-full bg-[#1E1F20] border-r border-[#333538]
        transition-all duration-300 ease-in-out z-50
        ${isSidebarOpen ? 'w-[280px]' : 'w-[76px]'}
      `}
    >
      <div className="h-16 flex items-center px-4 mt-2">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2.5 rounded-full hover:bg-[#282A2C] transition-colors flex-shrink-0 cursor-pointer text-[#C4C7C5]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className={`flex items-center overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-3 opacity-100 w-auto' : 'w-0 opacity-0 ml-0'}`}>
          <span className="text-lg font-medium tracking-wide text-[#A8C7FA] whitespace-nowrap">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain no-scrollbar">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.includes(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-3 rounded-full transition-all cursor-pointer group
                ${isActive ? 'bg-[#282A2C] text-[#E3E3E3]' : 'hover:bg-[#282A2C]/50 text-[#C4C7C5]'}
                ${!isSidebarOpen ? 'justify-center px-0' : 'justify-start'}
              `}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-[#A8C7FA]' : 'text-[#C4C7C5] group-hover:text-[#E3E3E3]'}`} />
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'ml-4 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 mb-2 space-y-1">
        <button onClick={onLeaveAdmin} className={`flex items-center px-4 py-3 w-full rounded-full hover:bg-[#282A2C]/50 text-[#C4C7C5] cursor-pointer font-medium transition-colors ${!isSidebarOpen ? 'justify-center px-0' : 'justify-start'}`}>
          <Store className="w-5 h-5 flex-shrink-0" />
          <span className={`text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'ml-4 opacity-100 w-auto block' : 'ml-0 opacity-0 w-0 hidden'}`}>Storefront</span>
        </button>
      </div>
    </aside>
  )
}