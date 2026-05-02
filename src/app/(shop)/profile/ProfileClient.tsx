// src/app/(shop)/profile/ProfileClient.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/services/auth.service'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/app/actions/get-profile'
import { Package, ShoppingBag, ShieldCheck, Lock, MapPin, HeadphonesIcon, LogOut, Settings, CreditCard, Heart } from 'lucide-react'
import Container from '@/components/ui/Container'

interface ProfileClientProps {
  user: User
  profile: UserProfile | null
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    window.location.href = '/'
  }

  const accountLinks = [
    {
      title: 'Products',
      desc: 'Browse our full catalog and start shopping',
      icon: ShoppingBag,
      href: '/products'
    },
    {
      title: 'Orders',
      desc: 'Track, return, or buy things again',
      icon: Package,
      href: '/profile/orders'
    },
    {
      title: 'Wishlist',
      desc: 'View and manage your saved products',
      icon: Heart,
      href: '/wishlist'
    },
    {
      title: 'Login & security',
      desc: 'Edit login, name, and mobile number',
      icon: ShieldCheck,
      href: '/profile/security'
    },
    {
      title: 'Addresses',
      desc: 'Edit addresses for orders and gifts',
      icon: MapPin,
      href: '/profile/addresses'
    },
    {
      title: 'Payment options',
      desc: 'Razorpay secure payment methods',
      icon: CreditCard,
      href: '/profile/payments'
    },
    {
      title: 'Contact Us',
      desc: 'Contact our customer service via phone or chat',
      icon: HeadphonesIcon,
      href: '/profile/contact'
    },
    {
      title: 'Legal & Privacy',
      desc: 'Terms of service and privacy policies',
      icon: Lock,
      href: '/terms'
    },
    {
      title: 'Account Settings',
      desc: 'Manage your account preferences',
      icon: Settings,
      href: '/profile/settings'
    }
  ]

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-6 tracking-tight">Your Account</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {accountLinks.map((link, idx) => {
            const Icon = link.icon
            return (
              <Link key={idx} href={link.href} className="flex items-start gap-4 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm group">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <Icon className="w-8 h-8 text-[#007185] stroke-[1.5]" />
                </div>
                <div className="flex-1 flex flex-col justify-center h-full">
                  <h2 className="text-base font-normal text-gray-900 group-hover:text-[#C7511F] transition-colors">{link.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">{link.desc}</p>
                </div>
              </Link>
            )
          })}

          {/* Logout Button Card */}
          <button onClick={() => setShowLogoutConfirm(true)} className="flex items-start gap-4 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-left group">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
              <LogOut className="w-8 h-8 text-red-600 stroke-[1.5]" />
            </div>
            <div className="flex-1 flex flex-col justify-center h-full">
              <h2 className="text-base font-normal text-gray-900 group-hover:text-red-700 transition-colors">Sign Out</h2>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">Securely log out of your account</p>
            </div>
          </button>
        </div>
      </Container>

      {/* Logout Modal */}
      {showLogoutConfirm && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-md shadow-xl max-w-sm w-full p-6 text-center border border-gray-200">
              <h3 className="text-xl font-normal text-gray-900 mb-2">Sign out</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 text-sm font-normal text-gray-900 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 py-2 text-sm font-normal text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm disabled:opacity-50 transition-colors"
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