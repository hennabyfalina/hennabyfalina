// src/components/admin/AdminCommandPalette.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Package, ShoppingCart, User, X, ArrowRight, Loader2 } from 'lucide-react'

interface SearchResults {
  products: any[]
  orders: any[]
  customers: any[]
}

export default function AdminCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ products: [], orders: [], customers: [] })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // 🚨 Listen for Keyboard Shortcuts (Cmd+K or Alt+K) 🚨
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey && e.key === 'k') || (e.altKey && e.key === 'k')) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Custom Event Listener for the Header Button click
  useEffect(() => {
    const handleOpenCommandPalette = () => setIsOpen(true)
    window.addEventListener('open-command-palette', handleOpenCommandPalette)
    return () => window.removeEventListener('open-command-palette', handleOpenCommandPalette)
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setResults({ products: [], orders: [], customers: [] })
    }
  }, [isOpen])

  // Lock background scrolling when palette is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Multi-table Search Logic with Debounce
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ products: [], orders: [], customers: [] })
        return
      }

      setIsLoading(true)
      const supabase = createClient()
      const searchTerm = `%${query}%`

      try {
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          // Search Products by Name or SKU
          supabase.from('products').select('id, name, sku, stock').or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`).limit(4),
          // Search Orders by Order Number
          supabase.from('orders').select('id, order_number, total_amount, status').ilike('order_number', searchTerm).limit(4),
          // Search Customers by Name or Email
          supabase.from('users').select('id, name, email').eq('role', 'customer').or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`).limit(4)
        ])

        setResults({
          products: productsRes.data || [],
          orders: ordersRes.data || [],
          customers: customersRes.data || [],
        })
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchResults, 300) // 300ms debounce
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleNavigate = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  if (!isOpen) return null

  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.customers.length > 0
  const isTyping = query.length > 0

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 sm:pt-32 px-4">
      {/* Heavy Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Main Palette Window */}
      <div className="relative w-full max-w-2xl bg-[#1E1F20] border border-[#333538] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[70vh]">
        
        {/* Input Header */}
        <div className="flex items-center px-4 py-4 border-b border-[#333538] bg-[#131314]">
          <Search className="w-5 h-5 text-[#8E9196] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, or customers..."
            className="flex-1 bg-transparent border-none text-[#E3E3E3] text-lg px-4 focus:outline-none placeholder:text-[#565959]"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-[#A8C7FA] animate-spin shrink-0" />
          ) : (
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-[#282A2C] text-[#8E9196] transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto no-scrollbar flex-1 bg-[#1E1F20] p-2">
          
          {!isTyping && (
            <div className="p-8 text-center text-[#565959] flex flex-col items-center">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Type to search across your workspace.</p>
              <div className="flex gap-2 mt-4 text-[10px] font-mono tracking-widest uppercase">
                <span className="bg-[#131314] border border-[#333538] px-2 py-1 rounded-md text-[#8E9196]">⌘ K (Mac)</span>
                <span className="bg-[#131314] border border-[#333538] px-2 py-1 rounded-md text-[#8E9196]">Alt K (Win)</span>
              </div>
            </div>
          )}

          {isTyping && !hasResults && !isLoading && (
            <div className="p-8 text-center text-[#8E9196]">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {/* Product Results */}
          {results.products.length > 0 && (
            <div className="mb-4">
              <p className="px-3 py-2 text-[10px] font-bold text-[#8E9196] uppercase tracking-widest">Products</p>
              <div className="space-y-1">
                {results.products.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => handleNavigate(`/admin/products?search=${encodeURIComponent(product.name)}`)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-[#282A2C] group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#131314] border border-[#333538] flex items-center justify-center">
                        <Package className="w-4 h-4 text-[#A8C7FA]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors line-clamp-1">{product.name}</p>
                        <p className="text-[11px] text-[#8E9196] font-mono">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#565959] group-hover:text-[#A8C7FA] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Results */}
          {results.orders.length > 0 && (
            <div className="mb-4">
              <p className="px-3 py-2 text-[10px] font-bold text-[#8E9196] uppercase tracking-widest">Orders</p>
              <div className="space-y-1">
                {results.orders.map(order => (
                  <button 
                    key={order.id}
                    onClick={() => handleNavigate(`/admin/orders`)} // Orders usually handle search inside their page
                    className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-[#282A2C] group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3C1E0A] border border-[#4E270D] flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-[#F9AB00]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-mono font-medium text-[#E3E3E3] group-hover:text-[#F9AB00] transition-colors">{order.order_number}</p>
                        <p className="text-[11px] text-[#8E9196] uppercase">{order.status}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#565959] group-hover:text-[#F9AB00] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Results */}
          {results.customers.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-[10px] font-bold text-[#8E9196] uppercase tracking-widest">Customers</p>
              <div className="space-y-1">
                {results.customers.map(customer => (
                  <button 
                    key={customer.id}
                    onClick={() => handleNavigate(`/admin/customers`)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-[#282A2C] group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#214332]/40 border border-[#214332] flex items-center justify-center">
                        <User className="w-4 h-4 text-[#93D7A4]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#E3E3E3] group-hover:text-[#93D7A4] transition-colors">{customer.name || 'Unnamed User'}</p>
                        <p className="text-[11px] text-[#8E9196]">{customer.email}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#565959] group-hover:text-[#93D7A4] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}