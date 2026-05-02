'use client'

import { Share2 } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

interface ShareButtonProps {
  productName: string
  productSlug: string
}

export default function ShareButton({ productName, productSlug }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}/product/${productSlug}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard!', productSlug)
    }
  }

  return (
    <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-[#007185] hover:text-[#C7511F] hover:underline transition-colors cursor-pointer" title="Share this product">
      <Share2 className="w-4 h-4" />
      <span className="font-medium">Share</span>
    </button>
  )
}