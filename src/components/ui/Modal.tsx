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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        ref={modalRef}
        className="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-zoom-in"
      >
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-200 bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-bold text-[#0F1111]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-5 overflow-y-auto no-scrollbar bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}