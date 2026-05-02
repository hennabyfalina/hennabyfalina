// src/components/ui/Modal.tsx

'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        ref={modalRef}
        // 🚨 MAGIC: bg-white for Storefront, bg-[#1E1F20] for Admin
        className="relative bg-white dark:bg-[#1E1F20] rounded-xl dark:rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden border border-transparent dark:border-[#333538] animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-[#333538] bg-gray-50/50 dark:bg-[#131314] shrink-0">
          <h2 className="text-lg md:text-xl font-medium text-[#0F1111] dark:text-[#E3E3E3] tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-[#8E9196] hover:text-gray-900 dark:hover:text-[#E3E3E3] hover:bg-gray-200 dark:hover:bg-[#282A2C] rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto overscroll-contain no-scrollbar bg-white dark:bg-[#1E1F20]">
          {children}
        </div>
      </div>
    </div>
  )
}