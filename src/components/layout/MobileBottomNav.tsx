// src/components/layout/MobileBottomNav.tsx

'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cart.store'
import { Home, ShoppingCart, MoreHorizontal, Layers, UserCircle2 } from 'lucide-react'
import MoreMenuModal from '@/components/layout/MoreMenuModal'
import CategoriesModal from '@/components/layout/CategoriesModal'
import AccountModal from '@/components/layout/AccountModal'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const cartItems = useCartStore((state) => state.items)
  const [mounted, setMounted] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    setIsMoreMenuOpen(false)
    setIsCategoriesOpen(false)
    setIsAccountOpen(false)
  }, [pathname])

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  if (!mounted) return null
  if (pathname === '/checkout') return null

  // Define base nav items
  const baseNavItems = [
    {
      label: 'Home',
      icon: Home,
      onClick: () => router.push('/'),
      active: pathname === '/'
    },
    {
      label: 'Categories',
      icon: Layers,
      onClick: () => setIsCategoriesOpen(true),
      active: pathname.startsWith('/products') || pathname.startsWith('/categories') || isCategoriesOpen
    },
    {
      label: 'Cart',
      icon: ShoppingCart,
      onClick: () => router.push('/cart'),
      active: pathname.startsWith('/cart'),
      badge: cartItemCount
    },
    {
      label: 'Account',
      icon: UserCircle2,
      onClick: () => setIsAccountOpen(true),
      active: pathname.startsWith('/profile') || isAccountOpen
    },
    {
      label: 'More',
      icon: MoreHorizontal,
      onClick: () => setIsMoreMenuOpen(true),
      active: isMoreMenuOpen
    }
  ]

  // Filter for admin: remove Cart and More
  const navItems = isAdmin
    ? baseNavItems.filter(item => item.label !== 'Cart' && item.label !== 'More')
    : baseNavItems

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
        <div className="bg-[#131921] border-t border-white/10 px-2 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-14 sm:h-16">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center flex-1 h-full group outline-none"
              >
                <div className="relative mb-1 z-10">
                  <item.icon 
                    strokeWidth={item.active ? 2 : 1.5} 
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-200 ${
                      item.active ? 'text-[#00A8E1]' : 'text-white'
                    }`}
                  />
                  
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-[#f08804] text-gray-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#131921]">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  item.active ? 'text-white' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <CategoriesModal 
        isOpen={isCategoriesOpen} 
        onClose={() => setIsCategoriesOpen(false)} 
      />
      <AccountModal 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)} 
      />
      {!isAdmin && (
        <MoreMenuModal 
          isOpen={isMoreMenuOpen} 
          onClose={() => setIsMoreMenuOpen(false)} 
        />
      )}
    </>
  )
}