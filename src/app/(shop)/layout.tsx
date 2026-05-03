// src/app/(shop)/layout.tsx

'use client'

import { Suspense, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import Toaster from '@/components/ui/Toast'
import { useCartStore } from '@/store/cart.store'

function CartInitializer() {
  const loadCart = useCartStore((state) => state.loadCart)
  
  useEffect(() => {
    loadCart()
  }, [loadCart])
  
  return null
}

export default function ShopLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isProfilePage = pathname === '/profile'
  const isCheckoutPage = pathname === '/checkout'

  return (
    <div className="flex-1 flex flex-col w-full gpu-accelerated">
      <CartInitializer />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className={`flex-1 flex flex-col w-full relative min-h-screen overflow-x-hidden will-change-transform ${isCheckoutPage ? 'pb-0' : 'pb-24 md:pb-0'}`}>
        {children}
      </main>
      <MobileBottomNav />
      {!isProfilePage && !isCheckoutPage && <Footer />}
      <Toaster />
    </div>
  )
}