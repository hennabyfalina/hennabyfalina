// src/components/layout/MobileBottomNav.tsx

'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { Home, ShoppingBag, LayoutGrid, UserCircle2 } from 'lucide-react'
import AccountModal from '@/components/layout/AccountModal'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const cartItems = useCartStore((state) => state.items)
  const [mounted, setMounted] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    setIsAccountOpen(false)
  }, [pathname])

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  if (!mounted) return null
  // Hide on checkout and product details pages to maximize screen real estate
  if (pathname.startsWith('/checkout')) return null
  if (pathname.startsWith('/product/')) return null

  // 🚀 PM UPGRADE: The Golden "Rule of 4" Tabs. Maximum thumb target size, zero clutter.
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      onClick: () => router.push('/'),
      active: pathname === '/'
    },
    {
      label: 'Shop',
      icon: LayoutGrid,
      onClick: () => router.push('/products'),
      active: pathname.startsWith('/products') || pathname.startsWith('/categories') || pathname === '/search'
    },
    {
      label: 'Cart',
      icon: ShoppingBag,
      onClick: () => router.push('/cart'),
      active: pathname.startsWith('/cart'),
      badge: cartItemCount
    },
    {
      label: 'Account',
      icon: UserCircle2,
      onClick: () => setIsAccountOpen(true),
      active: pathname.startsWith('/profile') || isAccountOpen
    }
  ]

  return (
    <>
      <nav 
        className="fixed left-0 right-0 z-[90] md:hidden flex flex-col print:hidden bg-[#F0F7FF]/95 backdrop-blur-md border-t border-blue-100/50 transition-all select-none font-sans"
        style={{ bottom: 0 }}
      >
        <div className="px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1">
          <div className="flex items-center justify-around h-14 sm:h-16 w-full">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center flex-1 h-full group outline-none border-none bg-transparent cursor-pointer transition-colors"
              >
                {/* Active Indicator Top Line */}
                <div 
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full transition-all duration-300 ${
                    item.active ? 'bg-black opacity-100 scale-100' : 'bg-transparent opacity-0 scale-75'
                  }`} 
                />

                <div className="relative mb-0.5 z-10 pt-1.5">
                  <item.icon 
                    strokeWidth={item.active ? 2 : 1.5} 
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      item.active ? 'text-gray-950' : 'text-gray-500'
                    }`}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-gray-950 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-none">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Highly readable, capitalized tab labels */}
                <span className={`text-[11px] transition-colors duration-200 capitalize mt-1 ${
                  item.active ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Account Modal maintained here until we merge it into the sidebar routing later if needed */}
      <AccountModal 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)} 
      />
    </>
  )
}