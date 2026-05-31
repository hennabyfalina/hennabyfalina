// src/components/product/EditConflictModal.tsx

'use client'

import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface EditConflictModalProps {
  isOpen: boolean
  onReload: () => void
  onOverwrite: () => void
  isLoading: boolean
}

export default function EditConflictModal({ isOpen, onReload, onOverwrite, isLoading }: EditConflictModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Item Changed in Another Tab</h3>
          <p className="text-sm text-gray-600 mb-6">
            This cart item was modified in another browser tab. Your current changes may conflict with the latest version.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onReload}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#007185] hover:bg-[#005f6b] text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              
              Reload & See Latest
            </button>
            <button
              onClick={onOverwrite}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-full text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Overwrite Anyway
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
