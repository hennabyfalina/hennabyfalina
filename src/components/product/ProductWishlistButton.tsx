'use client'

import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist.store'
import { showToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface ProductWishlistButtonProps {
  productId: string
}

export default function ProductWishlistButton({ productId }: ProductWishlistButtonProps) {
  const { savedProductIds, toggleItem } = useWishlistStore()
  const isSaved = savedProductIds.includes(productId)
  const router = useRouter()

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await toggleItem(productId)
      showToast(isSaved ? 'Removed from Wishlist' : 'Saved to Wishlist', 'success')
    } catch (error: any) {
      if (error.message === 'unauthorized') {
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        router.push(`/login?next=${currentUrl}`)
      } else {
        showToast('Failed to update wishlist', 'error')
      }
    }
  }

  return (
    <button onClick={handleWishlist} className="flex items-center gap-1.5 text-sm text-[#007185] hover:text-[#C7511F] hover:underline transition-colors focus:outline-none cursor-pointer" title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}>
      <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
      <span className="font-medium">{isSaved ? 'Saved' : 'Save'}</span>
    </button>
  )
}