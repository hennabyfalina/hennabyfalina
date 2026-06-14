// src/components/product/ProductPageHeader.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Heart, ShoppingBag, Search, X, Loader2 } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist.store'
import { useCartStore } from '@/store/cart.store'
import { useEffect, useState, useRef } from 'react'
import { searchProductsWithSignedUrls } from '@/services/product.service'

interface ProductPageHeaderProps {
  productName?: string   // 🌟 Made optional for generic directory pages
  productId?: string     // 🌟 Made optional to support general routes
}

export default function ProductPageHeader({ productName, productId }: ProductPageHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Subscribing to client stores for high-fidelity counters
  const wishlistItems = useWishlistStore((state) => state.savedProductIds)
  const cartItems = useCartStore((state) => state.items)
  
  // Safe condition layout parsing check
  const isSaved = productId ? wishlistItems.includes(productId) : false
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchProductsWithSignedUrls(searchQuery.trim(), 6)
          setSuggestions(results)
          setShowSuggestions(true)
        } catch (error) {
          console.error('Search failed', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[150] w-full bg-[#F0F7FF] border-b border-blue-100/50 md:hidden select-none animate-in fade-in duration-200">
      <div className="h-14 px-3 flex items-center justify-between gap-2">
        
        {/* LEFT: Back navigation action targeting main products directory flow state */}
        <button
          onClick={() => {
            // If we are deep inside a collection filter, take them back to the clean products selection view
            if (searchParams?.get('category')) {
              router.push('/products')
            } else {
              router.back()
            }
          }}
          className="p-1 text-gray-800 hover:bg-stone-50 rounded-full transition-colors active:scale-95 cursor-pointer shrink-0"
          aria-label="Navigate back"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>

        {/* CENTER: App-style Realtime Search Bar */}
        <div ref={searchContainerRef} className="flex-1 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white border border-blue-100 focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-50 rounded-full px-3 h-9 outline-none transition-all duration-200">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[13px] font-semibold text-gray-900 px-2 placeholder-gray-400"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="shrink-0">
                {isSearching ? <Loader2 className="w-3 h-3 animate-spin text-gray-400" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
              </button>
            )}
          </form>

          {/* Realtime Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <ul className="py-1">
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products?category=${p.category_id}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <Search className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-[13px] text-gray-700 font-medium truncate capitalize">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: Minimal Transaction Icons (No Hard Shadows, Crisp Counter Badges) */}
        <div className="flex items-center gap-1 shrink-0">
          <Link 
            href="/wishlist" 
            className="relative p-1.5 text-gray-800 hover:text-red-500 transition-colors"
            aria-label="Wishlist"
          >
            <Heart 
              className={`w-[21px] h-[21px] ${mounted && isSaved ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} 
              strokeWidth={1.5} 
            />
            {mounted && wishlistItems.length > 0 && !showSuggestions && (
              <span className="absolute top-1 right-1 bg-gray-900 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white scale-90">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <Link 
            href="/cart" 
            className="relative p-1.5 text-gray-900"
            aria-label="Cart"
          >
            <ShoppingBag className="w-[21px] h-[21px] text-gray-900" strokeWidth={1.5} />
            {mounted && cartItemCount > 0 && (
              <span className="absolute top-1 right-1 bg-gray-900 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white scale-90">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  )
}