// src/components/layout/MobileSidebar.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth.service'
import { 
  UserCircle2, ShoppingBag, Sparkles, HelpCircle,
  ChevronDown, LogOut, ChevronRight, Loader2, 
} from 'lucide-react'
import Image from 'next/image'
import { siteConfig } from '@/config/site'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user, isAdmin, isLoading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>('shop') // Default open group
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  let currentPath = pathname
  if (searchParams?.toString()) currentPath += `?${searchParams.toString()}`
  const encodedCurrentUrl = encodeURIComponent(currentPath)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Close sidebar automatically upon route changes
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!isOpen || !mounted) return null

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    setShowLogoutConfirm(false)
    onClose()
    setIsLoggingOut(false)
    window.location.href = '/'
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prev => prev === groupId ? null : groupId)
  }

  // 🚀 PM UPGRADE: Highly structured, categorized routing architecture
  const navigationGroups = [
    {
      id: 'shop',
      label: 'Shop & Collections',
      icon: ShoppingBag,
      links: [
        { label: 'All Products', href: '/products' },
        { label: 'Bridal Henna Cones', href: '/search?category=Bridal' },
        { label: 'Organic Essential Oils', href: '/search?category=Oils' },
        { label: 'Practice Templates', href: '/search?category=Templates' },
        { label: 'Curated Bundles', href: '/search?category=Bundles' },
      ]
    },
    {
      id: 'account',
      label: 'My Account',
      icon: UserCircle2,
      links: [
        { label: 'Profile Details', href: '/profile' },
        { label: 'Track Orders', href: '/profile/orders' },
        { label: 'Saved Wishlist', href: '/wishlist' },
        { label: 'Account Settings', href: '/profile/settings' },
        ...(isAdmin ? [{ label: 'Admin Dashboard', href: '/admin-gate' }] : []),
      ]
    },
    {
      id: 'services',
      label: 'Services & Explore',
      icon: Sparkles,
      links: [
        { label: 'Bridal Bookings', href: '/services' },
        { label: 'Appointments', href: '/contact-support' },
        { label: 'Henna Portfolio', href: '/collections' },
      ]
    },
    {
      id: 'support',
      label: 'Support & Legal',
      icon: HelpCircle,
      links: [
        { label: 'Help Center & FAQs', href: '/contact-support' },
        { label: 'Returns & Refunds', href: '/returns-refunds' },
        { label: 'Terms & Conditions', href: '/terms-conditions' },
      ]
    }
  ]

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Studio Guest'

  return createPortal(
    <>
      <div className="fixed inset-0 z-[99999] flex md:hidden font-sans antialiased">
        {/* Backdrop Trigger */}
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" 
          onClick={onClose}
          aria-hidden="true" 
        />
        
        {/* Slide-out Sidebar Panel */}
        <div className="relative w-[85vw] max-w-sm h-full bg-white shadow-2xl flex flex-col animate-slide-right">
          
          {/* ========================================================= */}
          {/* HEADER: Authenticated User Canvas vs Guest Canvas         */}
          {/* ========================================================= */}
          <div className="shrink-0 border-b border-blue-100/50 bg-[#F0F7FF] px-6 py-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
            {/* Brand Identity Block */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-100 shrink-0">
                <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
              </div>
              <span className="text-[23px] font-normal capitalize tracking-tight text-gray-900" style={{ fontFamily: 'cursive' }}>
                {siteConfig.name}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="min-h-[48px] flex items-center">
                {isLoading && !user ? (
                  <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><Loader2 className="w-4 h-4 text-gray-300 animate-spin" /></div>
                    <div className="h-4 w-24 bg-gray-100 rounded"></div>
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-3 min-w-0 animate-fade-in">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[20px] font-semibold text-gray-900 truncate capitalize">Hello, {displayName.split(' ')[0]}</span>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href={`/login?next=${encodedCurrentUrl}`} 
                    onClick={onClose} 
                    className="w-full bg-black text-white h-12 flex items-center justify-center rounded-full text-[14px] font-bold hover:bg-stone-900 transition-colors capitalize shadow-sm animate-fade-in"
                  >
                    Log In / Register
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MIDDLE: Accordion Navigation Streams                      */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
            <nav className="flex flex-col w-full divide-y divide-gray-50">
              {navigationGroups.map((group) => {
                const isExpanded = expandedGroup === group.id
                
                // Hide "My Account" if not logged in (to prevent dead links)
                if (group.id === 'account' && !user) return null

                return (
                  <div key={group.id} className="flex flex-col bg-white">
                    {/* Accordion Toggle Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center justify-between w-full p-5 outline-none cursor-pointer transition-colors active:bg-gray-50"
                    >
                      <div className="flex items-center gap-3.5">
                        <group.icon className={`w-5 h-5 transition-colors ${isExpanded ? 'text-gray-900' : 'text-gray-400'}`} strokeWidth={1.8} />
                        <span className={`text-[16px] capitalize transition-colors ${isExpanded ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}>
                          {group.label}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2} />
                    </button>

                    {/* Expandable Link Block */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50/50 border-t border-gray-50 ${
                        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-none'
                      }`}
                    >
                      <div className="flex flex-col py-2 px-12">
                        {group.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="py-3 text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-between group/link capitalize"
                          >
                            <span>{link.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" strokeWidth={2} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* ========================================================= */}
          {/* FOOTER: Fixed Logout & Security Badge                     */}
          {/* ========================================================= */}
          {user && (
            <div className="shrink-0 p-6 border-t border-gray-50 bg-white pb-[max(env(safe-area-inset-bottom),1.5rem)] w-full">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-3 w-full py-2 text-red-400 hover:text-red-500 transition-colors font-medium text-[14px] outline-none capitalize group"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Sub-Modal Sheet */}
      {showLogoutConfirm && mounted && createPortal(
        <div className="z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fixed inset-0 font-sans antialiased">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowLogoutConfirm(false)} style={{ touchAction: 'none' }} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm border border-gray-50 animate-zoom-in text-left">
            <h2 className="text-[18px] font-semibold text-gray-900 mb-1.5 capitalize">Sign Out</h2>
            <p className="text-[14px] text-gray-500 font-medium mb-6 leading-relaxed capitalize">
              Are you sure you want to securely exit your session account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-full text-[14px] font-semibold transition-colors cursor-pointer capitalize shadow-none"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-full text-[14px] font-semibold hover:bg-red-700 transition-colors shadow-none disabled:opacity-30 cursor-pointer capitalize"
              >
                {isLoggingOut ? 'Leaving...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>,
    document.body
  )
}