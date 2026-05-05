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
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    setIsMoreMenuOpen(false)
    setIsCategoriesOpen(false)
    setIsAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false) // Hide on scroll down
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true)  // Show on scroll up
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  if (!mounted) return null
  if (pathname.startsWith('/checkout')) return null

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
      <nav 
        className={`fixed left-0 right-0 z-[100] md:hidden flex flex-col shadow-[0_-8px_20px_rgba(0,0,0,0.1)] print:hidden transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'} bg-white rounded-t-[24px] border-t border-gray-200`}
        style={{ bottom: 0 }}
      >
        <div className="px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 rounded-t-[24px]">
          <div className="flex items-center justify-around h-16 sm:h-[72px]">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center flex-1 h-full group outline-none cursor-pointer"
              >
                <div className="relative mb-1 z-10">
                  <item.icon 
                    strokeWidth={item.active ? 2.5 : 2} 
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-200 ${
                      item.active ? 'text-[#007185]' : 'text-gray-500'
                    }`}
                  />
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#f08804] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-bold transition-colors duration-200 ${
                  item.active ? 'text-[#007185]' : 'text-gray-500'
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