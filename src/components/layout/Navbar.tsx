// src/components/layout/Navbar.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth.service'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { ShoppingCart, UserCircle2, Search, ChevronDown, X, Heart } from 'lucide-react'
import { EXPLORE_LINKS, CATEGORIES_LIST } from '@/config/navigation'
import NameModal from '@/components/auth/NameModal'
import { searchProductsWithSignedUrls } from '@/services/product.service'
import { siteConfig } from '@/config/site'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAdmin, isLoading, isNameMissing } = useAuth()
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const cartItems = useCartStore((state) => state.items)
  const wishlistItems = useWishlistStore((state) => state.savedProductIds)
  const [mounted, setMounted] = useState(false)
  const [badgePop, setBadgePop] = useState(false)
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // New states for autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const currentSearch = searchParams.get('q')
    if (currentSearch) {
      setSearchQuery(currentSearch)
    } else {
      setSearchQuery('')
    }
  }, [searchParams])

  useEffect(() => {
    if (cartItemCount > 0 && mounted) {
      setBadgePop(true)
      const timer = setTimeout(() => setBadgePop(false), 300)
      return () => clearTimeout(timer)
    }
  }, [cartItemCount, mounted])

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for live suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2 && searchQuery.trim() !== searchParams.get('q')) {
        try {
          const results = await searchProductsWithSignedUrls(searchQuery.trim(), 6)
          setSuggestions(results)
          setShowSuggestions(true)
        } catch (error) {
          console.error('Failed to fetch suggestions', error)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchParams])

  if (pathname.startsWith('/checkout')) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push(`/search`)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    setLoggingOut(true)
    await signOut()
    setShowLogoutConfirm(false)
    setLoggingOut(false)
    router.push('/')
    router.refresh()
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

  const isPartiallyActive = (path: string) => pathname.startsWith(path)
  const isExactActive = (path: string) => pathname === path

  // 🚀 Capture the exact URL the user is currently on
  let currentPath = pathname
  if (searchParams.toString()) currentPath += `?${searchParams.toString()}`
  const encodedCurrentUrl = encodeURIComponent(currentPath)

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = isAdmin ? getMaskedEmail(user?.email || '') : user?.email

  const isAccountActive = isPartiallyActive('/profile') || isPartiallyActive('/admin-gate') || isPartiallyActive('/login')

  return (
    <>
      {/* Sticky wrapper for navbar */}
      <div className="sticky top-0 z-50 w-full print:hidden" suppressHydrationWarning>
        <header className="w-full bg-white text-gray-900 border-b border-gray-200 shadow-none" suppressHydrationWarning>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2" suppressHydrationWarning>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-6" suppressHydrationWarning>
            
            <div className="flex items-center justify-between shrink-0 w-full xl:w-auto" suppressHydrationWarning>
              <Link href="/" className="block text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gray-900 hover:text-[#0B57D0] transition-opacity flex items-center p-1 rounded-sm">
                <span className="hidden sm:inline">{siteConfig.name}</span>
                <span className="sm:hidden">{siteConfig.shortName}</span>
              </Link>

              {/* 🚨 NEW: Mobile Top-Right - Clean Standalone Wishlist */}
              <div className="flex xl:hidden items-center pr-1" suppressHydrationWarning>
                {!isAdmin && (
                  <Link href="/wishlist" className="relative flex items-center p-1.5" aria-label="Your Wishlist">
                    <Heart className={`w-[22px] h-[22px] ${isExactActive('/wishlist') ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500 transition-colors'}`} strokeWidth={2} />
                    {mounted && wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-1 bg-[#f08804] text-[#131921] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>

            <div ref={searchContainerRef} className="flex flex-1 w-full max-w-4xl relative z-40" suppressHydrationWarning>
              <form onSubmit={handleSearch} className="flex flex-1 w-full relative rounded-md overflow-hidden bg-white border border-gray-300 focus-within:border-[#0B57D0] focus-within:ring-1 focus-within:ring-[#0B57D0] transition-all shadow-none">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
                  placeholder="Search for packaging materials, boxes..."
                  className="w-full pl-4 pr-14 sm:pr-16 py-2 text-sm text-gray-900 bg-transparent focus:outline-none transition-colors placeholder-gray-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSuggestions([])
                      setShowSuggestions(false)
                      if (pathname === '/search') router.push('/products')
                    }}
                    className="absolute right-12 sm:right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none p-1.5 cursor-pointer bg-white"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
                <button type="submit" className="absolute right-0 top-0 bottom-0 w-12 sm:w-14 bg-[#febd69] hover:bg-[#f3a847] text-gray-900 transition-colors flex items-center justify-center focus:outline-none z-10 border-l border-[#f3a847] cursor-pointer" aria-label="Search">
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </button>
              </form>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 shadow-2xl rounded-sm z-50 overflow-hidden" suppressHydrationWarning>
                  <ul className="py-1">
                    {suggestions.map((product) => (
                      <li key={product.id}>
                        <Link 
                          href={`/product/${product.slug}`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer group border-b border-gray-50 last:border-0"
                        >
                          <Search className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-900 font-medium line-clamp-1 group-hover:text-[#C7511F]">
                              {product.name}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="hidden xl:flex items-center gap-1 shrink-0" suppressHydrationWarning>
              <nav className="flex items-center gap-1">

                {/* Categories Dropdown - always visible */}
                <div className="relative group h-full" suppressHydrationWarning>
                  <button className="flex items-center gap-1 px-3 py-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-sm transition-all outline-none text-gray-800 font-bold text-sm cursor-pointer">
                    Categories
                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-900 transition-colors" />
                  </button>
                  <div className="absolute top-full left-0 mt-0.5 w-64 bg-white rounded-sm shadow-xl border border-gray-200 py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150" suppressHydrationWarning>
                    {CATEGORIES_LIST.map((cat) => (
                      <Link
                        key={cat.id}
                        href={cat.href}
                        target="_blank"
                        className="block px-5 py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-100 transition-colors"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Explore Dropdown - hide for admin */}
                {!isAdmin && (
                  <div className="relative group h-full" suppressHydrationWarning>
                    <button className="flex items-center gap-1 px-3 py-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-sm transition-all outline-none text-gray-800 font-bold text-sm cursor-pointer">
                      Explore
                      <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-900 transition-colors" />
                    </button>
                    <div className="absolute top-full left-0 mt-0.5 w-56 bg-white rounded-sm shadow-xl border border-gray-200 py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150" suppressHydrationWarning>
                      {EXPLORE_LINKS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          className="block px-5 py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-100 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Dropdown */}
                <div className="relative group h-full" suppressHydrationWarning>
                  <Link href={user ? (isAdmin ? "/admin-gate" : "/profile") : `/login?next=${encodedCurrentUrl}`} target="_blank" className="flex items-center gap-2 px-3 py-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-sm transition-all outline-none">
                    <UserCircle2 className={`w-6 h-6 ${isAccountActive ? 'text-[#0B57D0]' : 'text-gray-600 group-hover:text-gray-900'}`} strokeWidth={1.5} />
                    <div className="flex flex-col items-start leading-none text-left" suppressHydrationWarning>
                      <span className="text-[11px] font-medium text-gray-500">
                        {isLoading ? 'Loading...' : (user ? 'Hello,' : 'Sign in')}
                      </span>
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        {user ? displayName.split(' ')[0] : 'Account & Lists'}
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900 transition-colors" />
                      </span>
                    </div>
                  </Link>

                  <div className="absolute top-full right-0 mt-0.5 w-72 bg-white rounded-sm shadow-2xl border border-gray-200 py-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150" suppressHydrationWarning>
                    {user ? (
                      <div className="px-4">
                        <div className="bg-gray-50 p-3 rounded-sm border border-gray-200 mb-3">
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 px-1">Account</h4>
                          {isAdmin ? (
                            <Link href="/admin-gate" target="_blank" className="block px-2 py-1.5 text-sm text-gray-700 hover:text-[#007185] hover:underline transition-colors">Admin Dashboard</Link>
                          ) : (
                            <>
                              <Link href="/profile" target="_blank" className="block px-2 py-1.5 text-sm text-gray-700 hover:text-[#007185] hover:underline transition-colors">Your Profile</Link>
                              <Link href="/profile/orders" target="_blank" className="block px-2 py-1.5 text-sm text-gray-700 hover:text-[#007185] hover:underline transition-colors">Your Orders</Link>
                              <Link href="/wishlist" target="_blank" className="block px-2 py-1.5 text-sm text-gray-700 hover:text-[#007185] hover:underline transition-colors">Your Wishlist</Link>
                            </>
                          )}
                        </div>
                        <div className="border-t border-gray-200 mt-3 pt-3">
                          <button onClick={handleLogoutClick} className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:text-red-800 hover:underline transition-colors">Sign Out</button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-2 text-center flex flex-col items-center" suppressHydrationWarning>
                        <Link href={`/login?next=${encodedCurrentUrl}`} target="_blank" className="w-full py-2 bg-[#FFD814] hover:bg-[#FFD814] text-gray-900 text-sm font-medium rounded-sm border border-[#FFD814] shadow-sm transition-colors">
                          Sign in
                        </Link>
                        <p className="text-xs mt-3 text-gray-600">
                          New customer? <Link href={`/login?next=${encodedCurrentUrl}`} target="_blank" className="text-[#007185] hover:underline hover:text-orange-600">Start here.</Link>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart Icon - hide for admin */}
                {!isAdmin && (
                  <Link href="/cart" className="flex items-end gap-1 px-3 py-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-sm transition-all ml-1 group" suppressHydrationWarning>
                    <div className="relative flex items-center" suppressHydrationWarning>
                      <ShoppingCart className={`w-8 h-8 transition-colors ${isExactActive('/cart') ? 'text-[#0B57D0]' : 'text-gray-600 group-hover:text-gray-900'}`} strokeWidth={1.5} />
                      {mounted && cartItemCount > 0 ? (
                        <span className="absolute -top-1.5 left-3.5 text-[#f08804] text-[15px] font-bold w-5 text-center">
                          {cartItemCount}
                        </span>
                      ) : (
                        <span className="absolute -top-1.5 left-3.5 text-[#f08804] text-[15px] font-bold w-5 text-center">
                          0
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 leading-tight">Cart</span>
                  </Link>
                )}

              </nav>
            </div>
          </div>
        </div>
      </header>
      </div>

      {showLogoutConfirm && mounted && createPortal(
        <div className="z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
          <div className="absolute inset-0" onClick={() => setShowLogoutConfirm(false)} style={{ touchAction: 'none' }} />
          <div className="relative z-10 bg-white rounded-md shadow-2xl p-6 w-full max-w-sm border border-gray-200 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign out</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 px-4 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-sm text-sm font-medium transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmLogout} disabled={loggingOut} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-sm text-sm font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 border border-red-700 cursor-pointer">
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isNameMissing && user && (
        <NameModal 
          userId={user.id} 
          email={user.email} 
          onComplete={() => window.location.reload()} 
        />
      )}
    </>
  )
}