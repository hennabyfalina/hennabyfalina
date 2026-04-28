// src/app/(shop)/wishlist/WishlistClient.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HeartCrack } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { useWishlistStore } from '@/store/wishlist.store'

interface WishlistClientProps {
  initialItems: any[]
}

export default function WishlistClient({ initialItems }: WishlistClientProps) {
  const [displayItems, setDisplayItems] = useState(initialItems)
  const { savedProductIds, isInitialized } = useWishlistStore()

  // 🚨 This instantly removes the item from the UI the millisecond the global store updates
  useEffect(() => {
    if (isInitialized) {
      setDisplayItems((prevItems) => 
        prevItems.filter((item) => savedProductIds.includes(item.product.id))
      )
    }
  }, [savedProductIds, isInitialized])

  if (displayItems.length === 0) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-sm border border-gray-200 text-center shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <HeartCrack className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-sm text-gray-600 mb-6">Save items you want to buy later by clicking the heart icon.</p>
        <Link
          href="/products"
          className="inline-block px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-gray-900 text-sm font-medium rounded-sm transition-colors shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {displayItems.map((item) => (
        <div key={item.wishlist_id} className="h-full">
          <ProductCard product={item.product as any} />
        </div>
      ))}
    </div>
  )
}