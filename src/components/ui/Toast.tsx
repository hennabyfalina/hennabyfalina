// src/components/ui/Toast.tsx

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminThemeStore } from '@/store/theme.store'
import { Check, X, AlertCircle } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  productId?: string
  visible: boolean
  timerId?: NodeJS.Timeout
}

const toasts: ToastItem[] = []
let listeners: ((toasts: ToastItem[]) => void)[] = []

const notify = () => listeners.forEach(l => l([...toasts]))

export const removeToast = (id: string, immediate = false) => {
  const idx = toasts.findIndex(t => t.id === id)
  if (idx !== -1) {
    if (toasts[idx].timerId) clearTimeout(toasts[idx].timerId)
    if (immediate) {
      toasts.splice(idx, 1)
      notify()
    } else {
      toasts[idx].visible = false
      notify()
      setTimeout(() => {
        const removeIdx = toasts.findIndex(t => t.id === id)
        if (removeIdx !== -1 && !toasts[removeIdx].visible) {
          toasts.splice(removeIdx, 1)
          notify()
        }
      }, 300)
    }
  }
}

export const showToast = (message: string, productId?: string) => {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: ToastItem = { id, message, productId, visible: true }
  newToast.timerId = setTimeout(() => removeToast(id), 4000)
  toasts.push(newToast)

  const visibleToasts = toasts.filter(t => t.visible)
  if (visibleToasts.length > 3) {
    removeToast(visibleToasts[0].id, true)
  }
  notify()
}

export default function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const themeStore = useAdminThemeStore()
  const theme = themeStore?.theme || 'dark'

  useEffect(() => {
    setMounted(true)
    listeners.push(setCurrentToasts)
    return () => { listeners = listeners.filter(l => l !== setCurrentToasts) }
  }, [])

  if (!mounted) return null

  const isAdmin = pathname.startsWith('/admin')
  const isProductPage = pathname.startsWith('/product/')

  return createPortal(
    <div
      className={`fixed z-[999999] flex flex-col gap-3 transition-all duration-500 max-w-sm w-full left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-8
        ${isAdmin 
          ? `bottom-[90px] px-4 sm:bottom-8 sm:left-8 sm:right-auto admin-theme-${theme}` 
          : isProductPage
            ? 'bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+68px)] px-4 sm:bottom-12' // Adaptive clearance prevents overlaying the sticky mobile buy dock
            : 'bottom-[92px] px-4 sm:bottom-12'
        } pointer-events-none`}
    >
      {currentToasts.map(toast => {
        const msgLower = (toast.message || '').toString().toLowerCase()
        const isError = msgLower.includes('fail') || msgLower.includes('error') || msgLower.includes('out of stock') || msgLower.includes('sold out')
        
        const isCartPage = pathname === '/cart'
        const isWishlistPage = pathname === '/wishlist'
        const showGoToWishlist = !isAdmin && !isWishlistPage && msgLower.includes('wishlist')
        const showGoToCart = !isAdmin && !isCartPage && !showGoToWishlist && (msgLower.includes('cart') || msgLower.includes('bag') || msgLower.includes('added'))
        const showGoToShopping = !isAdmin && isCartPage && (msgLower.includes('cart') || msgLower.includes('bag') || msgLower.includes('cleared'))
        
        return (
          <div
            key={toast.id}
            className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto transform w-full flex flex-col overflow-hidden rounded-xl border
              ${isAdmin 
                ? 'admin-bg-card admin-border shadow-2xl rounded-lg' 
                : 'bg-white/95 backdrop-blur-md border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
              }
              ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
            `}
          >
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3 min-w-0">
                {!isAdmin && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-red-50 text-red-600' : 'bg-stone-50 text-gray-900'}`}>
                    {isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </div>
                )}
                
                <span className={`text-[13px] font-medium tracking-wide ${isAdmin ? 'admin-text-primary' : 'text-gray-800'}`}>
                  {toast.message}
                </span>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {/* Clean Studio Capitalized Navigation Micro-Pills */}
                {showGoToCart && !isError && (
                  <Link href="/cart" onClick={() => removeToast(toast.id, true)} className="h-8 px-3.5 flex items-center justify-center text-[11px] font-bold bg-gray-900 hover:bg-black text-white rounded-full transition-colors whitespace-nowrap capitalize tracking-wide shadow-sm">
                    View Bag
                  </Link>
                )}
                {showGoToShopping && !isError && (
                  <Link href="/products" onClick={() => removeToast(toast.id, true)} className="h-8 px-3.5 flex items-center justify-center text-[11px] font-bold bg-gray-900 hover:bg-black text-white rounded-full transition-colors whitespace-nowrap capitalize tracking-wide shadow-sm">
                    Shop Collection
                  </Link>
                )}
                {showGoToWishlist && !isError && (
                  <Link href="/wishlist" onClick={() => removeToast(toast.id, true)} className="h-8 px-3.5 flex items-center justify-center text-[11px] font-bold bg-gray-900 hover:bg-black text-white rounded-full transition-colors whitespace-nowrap capitalize tracking-wide shadow-sm">
                    View Wishlist
                  </Link>
                )}

                {/* Close Button Trigger */}
                {isAdmin ? (
                  <button onClick={() => removeToast(toast.id)} className="text-[12px] font-bold admin-text-accent hover:admin-bg-elevated px-2.5 py-1.5 rounded transition-colors capitalize tracking-wide cursor-pointer shrink-0" aria-label="Close">
                    Close
                  </button>
                ) : (
                  <button onClick={() => removeToast(toast.id)} className="transition-colors p-1 text-gray-400 hover:text-gray-900 cursor-pointer shrink-0" aria-label="Close">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>,
    document.body
  )
}