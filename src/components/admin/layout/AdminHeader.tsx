// src/components/admin/layout/AdminHeader.tsx

'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, RefreshCw, Store, LogOut } from 'lucide-react'

interface AdminHeaderProps {
  isSuperAdmin: boolean
  userEmail: string
  initial: string
  isRefreshing: boolean
  onRefresh: () => void
  onSignOut: () => void
}

export default function AdminHeader({ 
  isSuperAdmin, 
  userEmail, 
  initial, 
  isRefreshing, 
  onRefresh, 
  onSignOut 
}: AdminHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useProfileState()
  const profileRef = useRef<HTMLDivElement>(null)

  const getMaskedEmail = (email: string) => {
    if (!email) return 'A****@****.com'
    const [name, domain] = email.split('@')
    return `${name.charAt(0)}********@${domain}`
  }

  return (
    <header className="shrink-0 h-[76px] admin-bg-primary px-6 hidden md:flex items-center justify-between sticky top-0 z-30 pt-3">
      <div className="flex items-center">
        <Link href="/admin/dashboard" className="text-xl font-medium tracking-tight admin-text-accent transition-opacity hover:opacity-80">
          {isSuperAdmin ? 'Super Admin' : 'Admin'}
        </Link>
      </div>

      <div className="flex items-center gap-4 relative" ref={profileRef}>
        <button
          onClick={onRefresh}
          className="flex items-center justify-center p-2.5 rounded-full hover:admin-bg-elevated transition-colors cursor-pointer admin-text-secondary"
          title="Sync Latest Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin admin-text-accent' : ''}`} />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex items-center gap-2 admin-bg-card hover:admin-bg-elevated px-4 py-2.5 rounded-full admin-text-secondary transition-colors cursor-pointer mr-2 border border-transparent hover:admin-border"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm font-medium">Search records...</span>
          <span className="ml-4 text-xs font-mono admin-bg-primary px-1.5 py-0.5 rounded admin-text-muted border admin-border">Alt K</span>
        </button>

        {/* Avatar ring */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="relative flex p-[2.5px] rounded-full cursor-pointer items-center justify-center"
          style={{ background: 'conic-gradient(from 0deg, #4285F4 0% 25%, #EA4335 25% 50%, #FBBC05 50% 75%, #34A853 75% 100%)' }}
        >
          <div className="w-8 h-8 rounded-full admin-bg-primary flex items-center justify-center border-[1.5px] admin-border bg-white overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="Admin" 
              width={20} 
              height={20} 
              className="w-5 h-5 object-contain"
            />
          </div>
        </button>

        {isProfileOpen && (
          <div className="absolute top-14 right-0 w-72 admin-bg-card rounded-[28px] border admin-border shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
            <p className="text-[11px] font-bold admin-text-muted uppercase tracking-widest mb-3 px-3">Identity Management</p>
            <div className="admin-bg-primary rounded-2xl p-4 border admin-border mb-4">
              <p className="text-sm font-bold admin-text-primary">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
              <p className="text-xs admin-text-muted font-mono mt-1">{getMaskedEmail(userEmail)}</p>
            </div>
            <div className="space-y-1">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium admin-text-primary hover:admin-bg-elevated rounded-full transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 admin-text-accent" /> Go to Storefront
              </a>
              <button
                onClick={() => { setIsProfileOpen(false); onSignOut(); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// Custom hook for profile state
function useProfileState() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  return [isProfileOpen, setIsProfileOpen] as const
}