// src/components/layout/Navbar.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/auth.service'
import Image from 'next/image'
import { useCartStore } from '@/store/cart.store'
import { useWishlistStore } from '@/store/wishlist.store'
import { ShoppingBag, UserCircle2, Search, ChevronDown, X, Heart, Loader2, Menu } from 'lucide-react'
import { EXPLORE_LINKS, CATEGORIES_LIST } from '@/config/navigation'
import NameModal from '@/components/auth/NameModal'
import { searchProductsWithSignedUrls } from '@/services/product.service'
import { siteConfig } from '@/config/site'

// 🚀 WE WILL BUILD THIS NEXT
import MobileSidebar from '@/components/layout/MobileSidebar'

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

  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const searchCache = useRef<Record<string, any[]>>({})

  // 🚀 PM UPGRADE: Mobile State Controllers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const inMobile = mobileSearchRef.current?.contains(target);
      const inDesktop = desktopSearchRef.current?.contains(target);
      
      if (!inMobile && !inDesktop) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()

    // ⚡ TRAFFIC FILTER: Increase minimum lookup length to 3 tokens to prevent character thrashing
    if (query.length < 3 || query === searchParams.get('q')) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // 🛡️ MEMORY ESCAPE: If keyword was searched before, serve it instantly from cache without checking the DB
    if (searchCache.current[query]) {
      setSuggestions(searchCache.current[query])
      setShowSuggestions(true)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchProductsWithSignedUrls(query, 6)
        searchCache.current[query] = results
        setSuggestions(results)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Failed to fetch autocomplete suggestions:', error)
      } finally {
        setIsSearching(false)
      }
    }, 350) // Increased debounce threshold to 350ms to allow users to finish typing phrases cleanly

    return () => clearTimeout(timer)
  }, [searchQuery, searchParams])

  // Hide entirely on checkout to preserve deep-focus funnel
  if (pathname.startsWith('/checkout')) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push(`/search`)
    }
    setShowSuggestions(false)
    setShowMobileSearch(false)
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

  let currentPath = pathname
  if (searchParams.toString()) currentPath += `?${searchParams.toString()}`
  const encodedCurrentUrl = encodeURIComponent(currentPath)

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = isAdmin ? getMaskedEmail(user?.email || '') : user?.email

  // Detect product page to optionally hide nav elements if needed (keeping standard for now)
  const isProductPage = pathname.startsWith('/product/') || (pathname.startsWith('/products') && searchParams.get('category'))

  return (
    <>
      {/* 🚀 FIXED: Invisible spacer block matches exact Navbar height to prevent layout shift beneath the fixed Navbar */}
      <div className={`w-full print:hidden h-[61px] sm:h-[65px] ${isProductPage ? 'hidden md:block' : ''}`} aria-hidden="true" />
      
      <div className={`fixed top-0 left-0 right-0 z-50 w-full print:hidden bg-[#F0F7FF] ${isProductPage ? 'hidden md:block' : ''}`} suppressHydrationWarning>
        <header className="w-full text-gray-900 border-b border-blue-100/50" suppressHydrationWarning>
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-1.5 sm:py-2" suppressHydrationWarning>
            
            {/* MASTER CONTAINER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-12 w-full" suppressHydrationWarning>
              
              {/* ========================================================================= */}
              {/* 📱 MOBILE HEADER (HAMBURGER | LOGO | SEARCH & CART)                       */}
              {/* ========================================================================= */}
              <div className="flex md:hidden items-center justify-between w-full h-12" suppressHydrationWarning>
                
                {/* Left: Drawer Toggle */}
                <div className="flex items-center shrink-0">
                  <button onClick={() => setIsSidebarOpen(true)} className="p-1 -ml-1 text-gray-950 cursor-pointer outline-none transition-transform active:scale-95">
                    <Menu className="w-[22px] h-[22px]" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Middle: Integrated Search Bar */}
                <div className="flex-1 px-3">
                  <div ref={mobileSearchRef} className="relative w-full">
                    <form onSubmit={handleSearch} className="relative w-full">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Search className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                        placeholder="Search products..."
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full bg-white border border-blue-100 rounded-full py-1.5 pl-9 pr-4 text-[14px] md:text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-50 outline-none transition-all capitalize"
                      />
                    </form>

                    {/* Mobile Autocomplete Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-xl z-[60] overflow-hidden">
                        <ul className="py-2">
                          {suggestions.map((product) => (
                            <li key={product.id}>
                              <Link href={`/product/${product.slug}`} onClick={() => { setShowSuggestions(false); setShowMobileSearch(false); }} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer group transition-colors text-left">
                                <Search className="w-4 h-4 text-gray-300 mr-4 shrink-0" strokeWidth={2} />
                                <span className="text-[13px] font-medium text-gray-600 line-clamp-1 capitalize">{product.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Wishlist Icon */}
                <div className="flex items-center shrink-0">
                  <Link href="/wishlist" className="relative flex items-center p-1 outline-none transition-transform active:scale-95" aria-label="Wishlist">
                    <Heart className="w-[20px] h-[20px] text-gray-950" strokeWidth={1.5} />
                    {mounted && wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-1 bg-black text-white text-[9px] font-bold w-[17px] h-[17px] rounded-full flex items-center justify-center shadow-none">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* 💻 DESKTOP HEADER LOGO & DROPDOWNS (Hidden on Mobile)                     */}
              {/* ========================================================================= */}
              <div className="hidden md:flex items-center gap-10 shrink-0" suppressHydrationWarning>
                <Link 
                  href="/" 
                  onClick={(e) => {
                    if (pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-3 text-xl lg:text-2xl font-normal text-gray-900 transition-opacity hover:opacity-80">
                  <div className="relative w-8 h-8 shrink-0">
                    <Image src="/logo.png" alt={`${siteConfig.name} Logo`} fill sizes="32px" className="object-contain" priority />
                  </div>
                  <span className="leading-tight tracking-tight text-[20px] font-normal capitalize" style={{ fontFamily: 'cursive' }}>
                    {siteConfig.name}
                  </span>
                </Link>

                <div className="flex items-center gap-6 h-full">
                  {/* Shop Dropdown */}
                  <div className="relative group h-full flex items-center">
                    <button className="flex items-center gap-1 text-[14px] font-semibold text-gray-600 hover:text-gray-950 transition-colors cursor-pointer outline-none capitalize">
                      <span>Shop</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-300 transition-transform duration-200 group-hover:rotate-180" strokeWidth={1.5} />
                    </button>
                    <div className="absolute top-[calc(100%+14px)] left-0 w-[400px] bg-white border border-gray-100 rounded-xl p-6 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 grid grid-cols-2 gap-x-6 gap-y-4 shadow-xl">
                      <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
                      {CATEGORIES_LIST.map((cat: any, index) => (
                        <Link key={index} href={cat.href || `/search?category=${encodeURIComponent(cat.label || cat.name)}`} className="text-[14px] font-medium text-gray-600 hover:text-blue-600 hover:underline decoration-2 underline-offset-4 transition-all capitalize">
                          {cat.label || cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Explore Dropdown */}
                  <div className="relative group h-full flex items-center">
                    <button className="flex items-center gap-1 text-[14px] font-semibold text-gray-600 hover:text-gray-950 transition-colors cursor-pointer outline-none capitalize">
                      <span>Explore</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-300 transition-transform duration-200 group-hover:rotate-180" strokeWidth={1.5} />
                    </button>
                    <div className="absolute top-[calc(100%+14px)] left-0 w-[400px] bg-white border border-gray-100 rounded-xl p-6 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 grid grid-cols-2 gap-x-6 gap-y-4 shadow-xl" suppressHydrationWarning>
                      <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
                      {EXPLORE_LINKS.map((link) => (
                        <Link key={link.href} href={link.href} className="text-[14px] font-medium text-gray-600 hover:text-blue-600 hover:underline decoration-2 underline-offset-4 transition-all capitalize">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 🔍 RESPONSIVE SEARCH BAR (Expands on Mobile, Persistent on Desktop)       */}
              {/* ========================================================================= */}
              <div className="hidden md:block w-full md:max-w-xl relative z-40" suppressHydrationWarning>
                <div ref={desktopSearchRef} className="w-full relative flex flex-col">
                  <form onSubmit={handleSearch} className="flex flex-1 w-full relative rounded-full overflow-hidden bg-white border border-blue-100 focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-50 transition-all duration-300">
                    <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                      <Search className="w-[16px] h-[16px] text-gray-300" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                      placeholder="Search products..."
                      autoComplete="off"
                      spellCheck="false"
                      className="w-full pl-11 pr-12 py-2 text-[13px] text-gray-900 bg-transparent focus:outline-none placeholder-gray-400 font-medium shadow-none border-none outline-none capitalize"
                    />
                    {searchQuery && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {isSearching && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                        {!isSearching && (
                          <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); if (pathname === '/search') router.push('/products'); }} className="text-gray-300 hover:text-gray-900 focus:outline-none cursor-pointer">
                            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </form>

                  {/* Curated Autocomplete Suggestions Panel Box */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-100 shadow-lg rounded-xl z-50 overflow-hidden" suppressHydrationWarning>
                      <ul className="py-2">
                        {suggestions.map((product) => (
                          <li key={product.id}>
                            <Link href={`/product/${product.slug}`} onClick={() => { setShowSuggestions(false); setShowMobileSearch(false); }} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer group transition-colors text-left">
                              <Search className="w-3.5 h-3.5 text-gray-200 mr-4 shrink-0 transition-colors group-hover:text-gray-900" strokeWidth={1.5} />
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-normal text-gray-500 line-clamp-1 group-hover:text-gray-950 capitalize">
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
              </div>

              {/* ========================================================================= */}
              {/* 💻 DESKTOP RIGHT ACTIONS (Hidden on Mobile)                               */}
              {/* ========================================================================= */}
              <div className="hidden md:flex items-center justify-end gap-8 shrink-0 text-gray-600" suppressHydrationWarning>
                <Link href="/wishlist" className="flex items-center gap-2 hover:text-gray-950 transition-colors" suppressHydrationWarning>
                  <div className="relative flex items-center">
                    <Heart className="w-[20px] h-[20px]" strokeWidth={1.2} />
                    {mounted && wishlistItems.length > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-medium w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-none">
                        {wishlistItems.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[14px] font-semibold capitalize">Wishlist</span>
                </Link>

                {/* Account Trigger Session Handling Matrix */}
                <div className="relative group h-full flex items-center" suppressHydrationWarning>
                  {isLoading ? (
                    <div className="w-12 h-6 bg-gray-50 animate-pulse rounded-full"></div>
                  ) : user ? (
                    <Link href={isAdmin ? "/admin-gate" : "/profile"} className="flex items-center gap-2 hover:text-gray-950 transition-colors cursor-pointer">
                      <UserCircle2 className="w-[20px] h-[20px]" strokeWidth={1.2} />
                      <span className="text-[14px] font-semibold capitalize">{displayName.split(' ')[0]}</span>
                    </Link>
                  ) : (
                    <Link href={`/login?next=${encodedCurrentUrl}`} className="bg-black text-white px-6 h-9 rounded-full text-[13px] font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center capitalize shadow-sm">
                      Log In
                    </Link>
                  )}

                  {/* Refined Account Submenu Workspace Dropdown Panel */}
                  {user && (
                    <div className="absolute top-[calc(100%+14px)] right-0 w-52 bg-white rounded-xl border border-gray-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-xl text-left" suppressHydrationWarning>
                      <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
                      <div className="px-5 py-3 border-b border-gray-50 mb-1">
                        <p className="text-[14px] font-semibold text-gray-950 truncate capitalize">{displayName}</p>
                        <p className="text-[11px] font-normal text-gray-400 truncate mt-0.5">{displayEmail}</p>
                      </div>
                      <div className="flex flex-col">
                        {isAdmin && (
                          <Link href="/admin-gate" className="px-5 py-2.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition-colors border-b border-gray-50 capitalize">Admin Dashboard</Link>
                        )}
                        <Link href="/profile" className="px-5 py-2.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition-colors capitalize">Profile</Link>
                        <Link href="/profile/orders" className="px-5 py-2.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition-colors capitalize">My Orders</Link>
                        <Link href="/wishlist" className="px-5 py-2.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition-colors capitalize">My Wishlist</Link>
                        <button onClick={handleLogoutClick} className="w-full text-left px-5 py-3 text-[14px] font-medium text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-colors cursor-pointer border-t border-gray-50 mt-1 capitalize outline-none">
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Secure Counter Cart Anchor Basket */}
                <Link href="/cart" className="flex items-center hover:text-gray-950 transition-colors" suppressHydrationWarning>
                  <div className="relative flex items-center">
                    <ShoppingBag className="w-[20px] h-[20px]" strokeWidth={1.2} />
                    {mounted && cartItemCount > 0 && (
                      <span className={`absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-medium w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-none transition-transform ${badgePop ? 'scale-110' : 'scale-100'}`}>
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[14px] font-semibold capitalize ml-2">Cart</span>
                </Link>

              </div>
            </div>
          </div>
        </header>
      </div>

      {/* 🚀 NEW: Mobile Slide-Out Sidebar Drawer */}
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Logout Confirmation Dialog Modal Sheet */}
      {showLogoutConfirm && mounted && createPortal(
        <div className="z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fixed inset-0 animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowLogoutConfirm(false)} style={{ touchAction: 'none' }} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm border border-gray-100 animate-zoom-in text-left flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-semibold text-gray-900 capitalize">Logout Account</h2>
              <p className="text-[14px] text-gray-500 font-medium mt-1.5 leading-relaxed">Are you sure you want to securely logout of your account workspace?</p>
            </div>
            <div className="flex gap-3 pt-3 w-full">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 h-11 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer capitalize">
                Cancel
              </button>
              <button onClick={confirmLogout} disabled={loggingOut} className="flex-1 h-11 bg-black text-white rounded-xl text-[14px] font-semibold hover:bg-stone-900 transition-colors disabled:opacity-30 cursor-pointer capitalize shadow-none">
                {loggingOut ? 'Logging Out...' : 'Logout'}
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