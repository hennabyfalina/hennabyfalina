// src/app/(shop)/layout.tsx

'use client'

import { Suspense, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import Toaster from '@/components/ui/Toast'
import { useCartStore } from '@/store/cart.store'
import { useAuth } from '@/hooks/useAuth'
import PasskeyOnboardingPrompt from '@/components/auth/PasskeyOnboardingPrompt'

function CartInitializer() {
  const loadCart = useCartStore((state) => state.loadCart)
  useEffect(() => { loadCart() }, [loadCart])
  return null
}

export default function ShopLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isProfilePage = pathname === '/profile'
  const isCheckoutPage = pathname === '/checkout'
  const { user } = useAuth()
  
  return (
    <div className="flex-1 flex flex-col w-full" suppressHydrationWarning>
      <CartInitializer />
      
      <Suspense fallback={null}>
        <Navbar key={user?.id || 'no-user'} />
      </Suspense>

      {/* 🚀 STRATEGIC HOOK: Renders the prompt context stripe cleanly beneath your navigation trails */}
      <PasskeyOnboardingPrompt />

      <main className={`flex-1 flex flex-col w-full relative min-h-screen overflow-x-hidden ${isCheckoutPage ? 'pb-0' : 'pb-24 md:pb-0'}`}>
        {children}
      </main>
      
      <MobileBottomNav />
      {!isProfilePage && !isCheckoutPage && <Footer />}
      <Toaster />
    </div>
  )
}