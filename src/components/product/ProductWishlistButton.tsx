// src/components/product/ProductWishlistButton.tsx

'use client'

import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist.store'
import { showToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface ProductWishlistButtonProps {
  productId: string;
  showText?: boolean;
}

export default function ProductWishlistButton({ productId, showText = true }: ProductWishlistButtonProps) {
  const { savedProductIds, toggleItem } = useWishlistStore()
  const isSaved = savedProductIds.includes(productId)
  const router = useRouter()

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const willBeSaved = !isSaved
    
    showToast(willBeSaved ? 'Added to wishlist' : 'Removed from wishlist', 'success')
    
    try {
      const result = await toggleItem(productId)
      
      if (result === false && willBeSaved) {
        // Unauthorized – store pending wishlist and redirect
        sessionStorage.setItem('pendingWishlist', productId)
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        router.push(`/login?next=${currentUrl}`)
      }
    } catch (error: any) {
      // Fallback for any other error
      if (error.message === 'unauthorized') {
        sessionStorage.setItem('pendingWishlist', productId)
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        router.push(`/login?next=${currentUrl}`)
      } else {
        showToast('Failed to update wishlist', 'error')
      }
    }
  }

  return (
    <button 
      onClick={handleWishlist} 
      className="flex items-center gap-1.5 text-[14px] font-normal text-gray-600 hover:text-gray-950 transition-colors focus:outline-none cursor-pointer group" 
      title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={`w-4 h-4 transition-all active:scale-125 duration-200 ${
          isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'
        }`} 
        strokeWidth={1.5} 
      />
      {showText && <span>{isSaved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}