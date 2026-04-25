// src/components/layout/MoreMenuModal.tsx

'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { EXPLORE_LINKS } from '@/config/navigation'

interface MoreMenuModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MoreMenuModal({ isOpen, onClose }: MoreMenuModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm md:hidden animate-fade-in">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-t-md p-5 animate-slide-up pb-safe shadow-2xl">
        <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-3">
          <h2 className="font-bold text-xl text-gray-900">Explore More</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-sm transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1 pb-4">
          <ul>
            {EXPLORE_LINKS.map((item) => (
              <li key={item.href} className="border-b border-gray-100 last:border-0">
                <Link
                  href={item.href}
                  target="_blank"
                  onClick={onClose}
                  className="flex items-center w-full py-3.5 px-2 text-sm font-medium text-gray-800 hover:text-[#007185] hover:bg-gray-50 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}