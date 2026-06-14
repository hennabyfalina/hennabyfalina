// src/app/(shop)/profile/ProfileClient.tsx

'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { signOut } from '@/services/auth.service'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/app/actions/get-profile'
import { Package, ShoppingBag, ShieldCheck, Lock, MapPin, HeadphonesIcon, LogOut, Settings, CreditCard, Heart, ChevronRight } from 'lucide-react'
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

  // 🚀 PM UPGRADE: Enforced perfect Capitalization and premium descriptions across link metadata arrays
  const accountLinks = [
    {
      title: 'Products Catalog',
      desc: 'Browse our full collections and manage active batch items',
      icon: ShoppingBag,
      href: '/products'
    },
    {
      title: 'Your Orders Log',
      desc: 'Track delivery dispatches, manage cancellations, or buy items again',
      icon: Package,
      href: '/profile/orders'
    },
    {
      title: 'Saved Wishlist',
      desc: 'View and edit your personal saved selection of premium products',
      icon: Heart,
      href: '/wishlist'
    },
    {
      title: 'Login & Security',
      desc: 'Update your login information, authorized name link, and phone number',
      icon: ShieldCheck,
      href: '/profile/security'
    },
    {
      title: 'Fulfillment Addresses',
      desc: 'Manage saved hub addresses for home delivery or studio pickup options',
      icon: MapPin,
      href: '/profile/addresses'
    },
    {
      title: 'Payment Options',
      desc: 'Review secured transactions and integrated Razorpay parameters',
      icon: CreditCard,
      href: '/profile/payments'
    },
    {
      title: 'Contact & Support',
      desc: 'Get in touch with our customer service team via instant chat or call',
      icon: HeadphonesIcon,
      href: '/contact-support'
    },
    {
      title: 'Legal & Privacy Policy',
      desc: 'Review clear guidelines regarding terms of service and refunds',
      icon: Lock,
      href: '/terms-conditions'
    },
    {
      title: 'Account Settings',
      desc: 'Configure notification rules and global profile preferences',
      icon: Settings,
      href: '/profile/settings'
    }
  ]

  return (
    <div className="min-h-screen bg-white py-8 md:py-14 font-sans antialiased select-none text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Title Heading Section */}
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 mb-8 tracking-tight capitalize">Your Account</h1>
        
        {/* 🚀 FIXED: Rebuilt legacy box matrices into ultra-clean borderless Apple-style interactive panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {accountLinks.map((link, idx) => {
            const Icon = link.icon
            return (
              <Link 
                key={idx} 
                href={link.href} 
                className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all group outline-none"
              >
                {/* Monochrome Soft Floating Icon Container */}
                <div className="w-10 h-10 rounded-xl bg-stone-50/50 border border-gray-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-stone-100 group-hover:text-black text-gray-400">
                  <Icon className="w-[21px] h-[21px] transition-colors duration-200" strokeWidth={1.8} />
                </div>
                
                <div className="flex-1 flex flex-col justify-start">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <h2 className="text-[15px] font-normal text-gray-900 transition-colors group-hover:text-black tracking-tight capitalize">
                      {link.title}
                    </h2>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" strokeWidth={2} />
                  </div>
                  <p className="text-[13px] text-gray-400 font-normal mt-1 leading-normal capitalize">
                    {link.desc}
                  </p>
                </div>
              </Link>
            )
          })}

          {/* Secure Monochrome Disconnect Handle */}
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl transition-all text-left group cursor-pointer outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50/30 border border-red-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-red-50 text-red-500 group-hover:text-red-600">
              <LogOut className="w-[20px] h-[20px] transition-colors duration-200" strokeWidth={1.8} />
            </div>
            <div className="flex-1 flex flex-col justify-start">
              <h2 className="text-[15px] font-normal text-gray-900 group-hover:text-red-600 transition-colors tracking-tight capitalize">
                Sign Out
              </h2>
              <p className="text-[13px] text-gray-400 font-normal mt-1 leading-normal capitalize">
                Securely close your active session account workspace
              </p>
            </div>
          </button>
        </div>
      </Container>

      {/* ========================================================================= */}
      {/* 🚀 MODAL DIALOG PORTAL: Synchronized 1:1 with Navbar & Sidebar Styles      */}
      {/* ========================================================================= */}
      {showLogoutConfirm && createPortal(
        <div className="z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fixed inset-0 font-sans antialiased text-left">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowLogoutConfirm(false)} style={{ touchAction: 'none' }} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm border border-gray-50 animate-zoom-in">
            
            <h2 className="text-[20px] font-normal text-gray-900 mb-1.5 capitalize">Sign Out</h2>
            <p className="text-[14px] text-gray-400 font-medium mb-6 leading-relaxed capitalize">
              Are you sure you want to securely exit your session account?
            </p>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-[14px] font-semibold transition-colors cursor-pointer capitalize shadow-none outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-full text-[14px] font-semibold hover:bg-red-700 transition-colors shadow-none disabled:opacity-30 cursor-pointer capitalize outline-none"
              >
                {loggingOut ? 'Leaving...' : 'Leave Now'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  )
}