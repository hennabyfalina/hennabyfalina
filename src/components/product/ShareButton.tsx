// src/components/product/ShareButton.tsx

'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import ShareModal from './ShareModal'

interface ShareButtonProps {
  productName: string
  productSlug: string
}

export default function ShareButton({ productName, productSlug }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${productSlug}` : ''

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsModalOpen(true)
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-[14px] font-normal text-gray-600 hover:text-gray-950 transition-colors cursor-pointer"
        title="Share this product"
      >
        <Share2 className="w-4 h-4 text-gray-400 hover:text-gray-950 transition-colors" strokeWidth={1.5} />
        <span>share</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productName={productName}
        productUrl={productUrl}
      />
    </>
  )
}