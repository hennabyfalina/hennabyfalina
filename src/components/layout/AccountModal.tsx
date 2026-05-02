// src/components/layout/AccountModal.tsx

'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth.service'
import { useState } from 'react'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { user, isAdmin } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (!isOpen) return null

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    setShowLogoutConfirm(false)
    onClose()
    setIsLoggingOut(false)
  }

  // Mask email function - same as navbar
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

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = isAdmin ? getMaskedEmail(user?.email || '') : user?.email

  return (
    <>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm md:hidden animate-fade-in">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        
        <div className="relative bg-white rounded-t-md p-5 animate-slide-up pb-safe shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
            <div>
              <h2 className="font-bold text-xl text-gray-900">
                {user ? `Hello, ${displayName}` : 'Your Account'}
              </h2>
              {user && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[220px]">
                  {displayEmail}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-sm transition-colors -mt-1"
              aria-label="Close account menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="pb-4 max-h-[70vh] overflow-y-auto overscroll-contain no-scrollbar">
            {user ? (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 px-2 py-2">Account Settings</h3>
                
                {isAdmin ? (
                  <Link
                    href="/admin-gate"
                    target="_blank"
                    onClick={onClose}
                    className="block py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#007185] hover:bg-gray-50 border-b border-gray-100"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      target="_blank"
                      onClick={onClose}
                      className="block py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#007185] hover:bg-gray-50 border-b border-gray-100"
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/profile/orders"
                      target="_blank"
                      onClick={onClose}
                      className="block py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#007185] hover:bg-gray-50 border-b border-gray-100"
                    >
                      Your Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      target="_blank"
                      onClick={onClose}
                      className="block py-3 px-2 text-sm font-medium text-gray-700 hover:text-[#007185] hover:bg-gray-50 border-b border-gray-100"
                    >
                      Your Wishlist
                    </Link>
                  </>
                )}
                
                <div className="pt-4">
                  <button
                    onClick={handleLogoutClick}
                    disabled={isLoggingOut}
                    className="w-full text-left py-3 px-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2 flex flex-col gap-4">
                <div className="text-center mb-2">
                  <p className="text-gray-600 text-sm mb-4">
                    Sign in to view your orders, track shipping, and manage your account.
                  </p>
                  <Link
                    href="/login"
                    target="_blank"
                    onClick={onClose}
                    className="block w-full py-3 bg-[#FFD814] text-gray-900 text-center font-bold text-sm rounded-sm border border-[#FCD200] shadow-sm hover:bg-[#F7CA00]"
                  >
                    Sign In
                  </Link>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    New customer?{' '}
                    <Link href="/login" target="_blank" onClick={onClose} className="text-[#007185] font-medium hover:underline hover:text-orange-600">
                      Start here.
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-md shadow-2xl p-6 w-full max-w-sm border border-gray-200 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign out</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-sm text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-sm text-sm font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 border border-red-700"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}