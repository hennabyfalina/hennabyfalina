// src/components/ui/Modal.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAdminThemeStore } from '@/store/theme.store'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const { theme } = useAdminThemeStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      // Add theme class to body for portal to inherit
      if (isAdmin && theme) {
        document.body.classList.add(`admin-theme-${theme}`)
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      if (isAdmin && theme) {
        document.body.classList.remove(`admin-theme-${theme}`)
      }
    }
  }, [isOpen, onClose, isAdmin, theme])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in ${isAdmin ? `admin-theme-${theme}` : ''}`}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" style={{ touchAction: 'none' }} />
      
      <div
        ref={modalRef}
        className={`relative z-10 shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden border animate-in zoom-in-95 duration-200 ${
          isAdmin ? 'admin-bg-card rounded-[32px] admin-border' : 'bg-white rounded-xl border-transparent'
        }`}
      >
        <div className={`flex justify-between items-center p-4 md:p-6 border-b shrink-0 ${
          isAdmin ? 'admin-border admin-bg-primary/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <h2 className={`text-lg md:text-xl font-medium tracking-tight ${
            isAdmin ? 'admin-text-primary' : 'text-[#0F1111]'
          }`}>{title}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isAdmin ? 'admin-text-muted hover:admin-text-primary hover:admin-bg-elevated' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`p-4 md:p-6 overflow-y-auto overscroll-contain no-scrollbar ${isAdmin ? 'admin-bg-card' : 'bg-white'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}