// src/components/product/ItemMissingModal.tsx

'use client'

import { createPortal } from 'react-dom'
import { AlertCircle } from 'lucide-react'

export default function ItemMissingModal({ onReload }: { onReload: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Cart Item Not Found</h3>
        <p className="text-gray-600 mb-6">
          This item was modified or removed in another tab. Your changes cannot be saved.
        </p>
        <button
          onClick={onReload}
          className="px-6 py-2 bg-[#007185] text-white rounded-full"
        >
          Reload Page
        </button>
      </div>
    </div>,
    document.body
  )
}