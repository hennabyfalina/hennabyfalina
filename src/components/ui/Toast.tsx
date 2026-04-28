// src/components/ui/Toast.tsx

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  productId?: string
  visible: boolean
  timerId?: NodeJS.Timeout
}

let toasts: ToastItem[] = []
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
  const existingIdx = toasts.findIndex(t => t.productId === productId && t.productId !== undefined && t.visible)

  if (existingIdx !== -1) {
    const existing = toasts[existingIdx]
    if (existing.timerId) clearTimeout(existing.timerId)
    toasts[existingIdx] = {
      ...existing,
      message,
      timerId: setTimeout(() => removeToast(existing.id), 4000)
    }
    notify()
  } else {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { id, message, productId, visible: true }
    newToast.timerId = setTimeout(() => removeToast(id), 4000)
    toasts.push(newToast)

    const visibleToasts = toasts.filter(t => t.visible)
    if (visibleToasts.length > 3) {
      const oldest = visibleToasts[0]
      removeToast(oldest.id, true)
    }
    notify()
  }
}

export default function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    listeners.push(setCurrentToasts)
    return () => { listeners = listeners.filter(l => l !== setCurrentToasts) }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed z-[150] flex flex-col gap-3 bottom-[80px] left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-[380px] pointer-events-none">
      {currentToasts.map(toast => {
        const msgLower = toast.message.toLowerCase()
        const isError = msgLower.includes('fail') || msgLower.includes('error') || msgLower.includes('out of stock')
        const isCartPage = pathname === '/cart'
        const isWishlistPage = pathname === '/wishlist'
        
        // 🚨 Determine which button to show cleanly
        const showGoToWishlist = !isWishlistPage && msgLower.includes('wishlist')
        const showGoToCart = !isCartPage && !showGoToWishlist && (msgLower.includes('cart') || msgLower.includes('added'))
        const showGoToShopping = isCartPage && (msgLower.includes('cart') || msgLower.includes('cleared'))
        
        return (
          <div
            key={toast.id}
            className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto transform origin-bottom w-full bg-white rounded-sm shadow-[0_4px_14px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden
              ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
            `}
          >
            <div className="flex items-center justify-between p-3.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {isError ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-[#0F1111] truncate">
                  {toast.message}
                </span>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {showGoToCart && !isError && (
                  <Link 
                    href="/cart" 
                    onClick={() => removeToast(toast.id, true)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-sm shadow-sm transition-colors whitespace-nowrap"
                  >
                    Go to Cart
                  </Link>
                )}
                {showGoToShopping && !isError && (
                  <Link 
                    href="/products" 
                    onClick={() => removeToast(toast.id, true)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-sm shadow-sm transition-colors whitespace-nowrap"
                  >
                    Go to Shopping
                  </Link>
                )}
                {/* Wishlist Link Button */}
                {showGoToWishlist && !isError && (
                  <Link 
                    href="/wishlist" 
                    onClick={() => removeToast(toast.id, true)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-sm shadow-sm transition-colors whitespace-nowrap"
                  >
                    View Wishlist
                  </Link>
                )}
                <button 
                  onClick={() => removeToast(toast.id)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>,
    document.body
  )
}