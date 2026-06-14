// src/components/layout/AccountModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { X, UserCircle2, ShoppingBag, Heart, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth.service'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { user, isAdmin } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  let currentPath = pathname
  if (searchParams?.toString()) currentPath += `?${searchParams.toString()}`
  const encodedCurrentUrl = encodeURIComponent(currentPath)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    setShowLogoutConfirm(false)
    onClose()
    setIsLoggingOut(false)
    window.location.reload()
  }

  const getMaskedEmail = (email: string) => {
    if (!email) return ''
    const [name, domain] = email.split('@')
    if (!domain) return email
    const maskedName = `${name.charAt(0)}*****`
    const domainParts = domain.split('.')
    const ext = domainParts.pop()
    const main = domainParts.join('.')
    const maskedMain = `${main.charAt(0)}****`
    return `${maskedName}@${maskedMain}.${ext}`
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Studio Guest'
  const displayEmail = isAdmin ? getMaskedEmail(user?.email || '') : user?.email

  return createPortal(
    <>
      <div className="z-[99999] flex flex-col justify-end bg-black/30 backdrop-blur-sm md:hidden animate-fade-in font-sans antialiased select-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" style={{ touchAction: 'none' }} />
        
        {/* Flat minimal bottom sheet matching the exact aesthetics of the Sidebar */}
        <div className="relative bg-white rounded-t-[24px] p-6 animate-slide-up pb-safe shadow-2xl z-10 border-t border-gray-100">
          
          {/* Header Block Section */}
          <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
              {user && (
                <div className="w-11 h-11 rounded-full bg-stone-50 border border-gray-200 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                </div>
              )}
              <div className="flex flex-col">
                <h2 className="font-semibold text-[17px] text-gray-900 tracking-tight capitalize">
                  {user ? `Hello, ${displayName.split(' ')[0]}` : 'My Account'}
                </h2>
                {user && (
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5 break-all">
                    {displayEmail}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors -mt-1 outline-none"
              aria-label="Close account menu"
            >
              <X className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </div>

          <nav className="pb-4 pt-2 max-h-[60vh] overflow-y-auto overscroll-contain no-scrollbar">
            {user ? (
              <div className="flex flex-col text-[15px] font-medium text-gray-600">
                
                {isAdmin ? (
                  <Link href="/admin-gate" onClick={onClose} className="flex items-center gap-3.5 py-4 border-b border-gray-50 text-gray-900 hover:bg-gray-50 transition-colors px-2 rounded-lg capitalize">
                    <Settings className="w-4.5 h-4.5 text-gray-400" strokeWidth={1.8} />
                    <span className="font-semibold">Admin Control Center</span>
                  </Link>
                ) : (
                  <>
                    <Link href="/profile" onClick={onClose} className="flex items-center gap-3.5 py-4 border-b border-gray-50 hover:text-gray-900 hover:bg-gray-50 transition-colors px-2 rounded-lg capitalize">
                      <UserCircle2 className="w-4.5 h-4.5 text-gray-400" strokeWidth={1.8} />
                      <span>My Profile</span>
                    </Link>
                    <Link href="/profile/orders" onClick={onClose} className="flex items-center gap-3.5 py-4 border-b border-gray-50 hover:text-gray-900 hover:bg-gray-50 transition-colors px-2 rounded-lg capitalize">
                      <ShoppingBag className="w-4.5 h-4.5 text-gray-400" strokeWidth={1.8} />
                      <span>Track Orders</span>
                    </Link>
                    <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3.5 py-4 border-b border-gray-50 hover:text-gray-900 hover:bg-gray-50 transition-colors px-2 rounded-lg capitalize">
                      <Heart className="w-4.5 h-4.5 text-gray-400" strokeWidth={1.8} />
                      <span>My Wishlist</span>
                    </Link>
                  </>
                )}
                
                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3.5 w-full text-left py-4 text-red-600 font-semibold hover:bg-red-50 transition-colors px-2 rounded-lg mt-2 capitalize outline-none"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-500" strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="py-4 flex flex-col gap-6">
                <div className="text-center px-2">
                  <p className="text-gray-500 font-medium text-[14px] mb-6 leading-relaxed max-w-sm mx-auto capitalize">
                    Sign in securely to review past bridal stains, coordinate active delivery shipments, and save wishlist cones.
                  </p>
                  <Link
                    href={`/login?next=${encodedCurrentUrl}`}
                    onClick={onClose}
                    className="flex items-center justify-center w-full h-12 bg-black text-white text-[14px] font-semibold tracking-wide capitalize rounded-full hover:bg-stone-900 transition-colors shadow-none"
                  >
                    Log In / Register
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Sub-Modal Sheet - Perfectly matched to Navbar/Sidebar UI */}
      {showLogoutConfirm && mounted && createPortal(
        <div className="z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fixed inset-0 font-sans antialiased text-left">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowLogoutConfirm(false)} style={{ touchAction: 'none' }} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm border border-gray-50 animate-zoom-in">
            <h2 className="text-[18px] font-semibold text-gray-900 mb-1.5 capitalize">Sign Out</h2>
            <p className="text-[14px] text-gray-500 font-medium mb-6 leading-relaxed capitalize">
              Are you sure you want to securely exit your session account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-[14px] font-semibold transition-colors cursor-pointer capitalize shadow-none outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-full text-[14px] font-semibold hover:bg-red-700 transition-colors shadow-none disabled:opacity-30 cursor-pointer capitalize outline-none"
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