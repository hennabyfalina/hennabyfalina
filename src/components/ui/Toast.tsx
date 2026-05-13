// src/components/ui/Toast.tsx

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle, AlertTriangle, X, XCircle } from 'lucide-react'

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

  useEffect(() => {
    setMounted(true)
    listeners.push(setCurrentToasts)
    return () => { listeners = listeners.filter(l => l !== setCurrentToasts) }
  }, [])

  if (!mounted) return null

  // 🚨 Environment Check: Determine if we are in the Admin Panel
  const isAdmin = pathname.startsWith('/admin')

  return createPortal(
    <div className={`fixed z-[999999] flex flex-col gap-3 transition-all duration-500
      ${isAdmin 
        ? 'bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4' // Gemini Admin: Bottom Center
        : 'bottom-[80px] left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-[380px]' // Amazon Store: Bottom Right
      } pointer-events-none`}
    >
      {currentToasts.map(toast => {
        const msgLower = toast.message.toLowerCase()
        const isError = msgLower.includes('fail') || msgLower.includes('error') || msgLower.includes('out of stock')
        
        // 🚨 Logic for Amazon-style action links (Store only)
        const isCartPage = pathname === '/cart'
        const isWishlistPage = pathname === '/wishlist'
        const showGoToWishlist = !isAdmin && !isWishlistPage && msgLower.includes('wishlist')
        const showGoToCart = !isAdmin && !isCartPage && !showGoToWishlist && (msgLower.includes('cart') || msgLower.includes('added'))
        const showGoToShopping = !isAdmin && isCartPage && (msgLower.includes('cart') || msgLower.includes('cleared'))
        
        return (
          <div
            key={toast.id}
            className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto transform origin-bottom w-full flex flex-col overflow-hidden
              ${isAdmin 
                ? 'bg-[#1E1F20] rounded-lg border border-[#333538] shadow-2xl' // 🚨 GOOGLE CLOUD STYLE
                : 'bg-white rounded-sm shadow-[0_4px_14px_rgba(0,0,0,0.15)] border border-[#D5D9D9]' // 🚨 AMAZON BOX
              }
              ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
            `}
          >
            <div className={`flex items-center justify-between gap-3 ${isAdmin ? 'p-3 px-4' : 'p-3.5'}`}>
              <div className="flex items-center gap-3 min-w-0">
                {!isAdmin && (
                  // 🚨 Amazon Store Icons
                  isError ? <XCircle className="w-5 h-5 text-red-600 shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                )}
                
                <span className={`text-sm font-medium ${isAdmin ? 'text-[#E3E3E3]' : 'text-[#0F1111]'}`}>
                  {toast.message}
                </span>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {/* 🚨 Amazon Yellow Action Buttons (Only for Storefront) */}
                {showGoToCart && !isError && (
                  <Link href="/cart" onClick={() => removeToast(toast.id, true)} className="px-3 py-1.5 text-xs font-bold bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-sm shadow-sm transition-colors whitespace-nowrap">
                    Go to Cart
                  </Link>
                )}
                {showGoToShopping && !isError && (
                  <Link href="/products" onClick={() => removeToast(toast.id, true)} className="px-3 py-1.5 text-xs font-bold bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-sm shadow-sm transition-colors whitespace-nowrap">
                    Go to Shopping
                  </Link>
                )}
                {showGoToWishlist && !isError && (
                  <Link href="/wishlist" onClick={() => removeToast(toast.id, true)} className="px-3 py-1.5 text-xs font-bold bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-sm shadow-sm transition-colors whitespace-nowrap">
                    View Wishlist
                  </Link>
                )}

                {/* Close Action */}
                {isAdmin ? (
                  <button onClick={() => removeToast(toast.id)} className="text-[12px] font-bold text-[#A8C7FA] hover:bg-[#A8C7FA]/10 px-3 py-2 rounded transition-colors uppercase tracking-wide cursor-pointer shrink-0" aria-label="Close">
                    Close
                  </button>
                ) : (
                  <button onClick={() => removeToast(toast.id)} className="transition-colors p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer" aria-label="Close">
                    <X className="w-4 h-4" />
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