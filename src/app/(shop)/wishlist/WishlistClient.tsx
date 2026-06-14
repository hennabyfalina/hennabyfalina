// src/app/(shop)/wishlist/WishlistClient.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Star, ChevronRight, Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist.store'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { showToast } from '@/components/ui/Toast'

interface WishlistClientProps {
  initialItems: any[]
}

export default function WishlistClient({ initialItems }: WishlistClientProps) {
  const [displayItems, setDisplayItems] = useState(initialItems)
  const { savedProductIds, isInitialized, toggleItem } = useWishlistStore()

  useEffect(() => {
    if (isInitialized) {
      setDisplayItems((prevItems) => 
        prevItems.filter((item) => savedProductIds.includes(item.product.id))
      )
    }
  }, [savedProductIds, isInitialized])

  const handleRemove = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    showToast('Removed From Wishlist', 'success')
    try {
      await toggleItem(productId)
    } catch (error) {}
  }

  return (
    <div className="w-full flex flex-col bg-white items-start pb-24 select-none font-sans antialiased text-left">
      
      {/* Studio Segment Breadcrumbs */}
      <div className="text-[15px] font-semibold text-gray-400 hover:text-gray-900 mb-5 transition-colors flex items-center gap-1">
        <Link href="/" className="capitalize">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-gray-900 capitalize">Wishlist</span>
      </div>

      {/* Master Workspace Title */}
      <h1 className="text-3xl md:text-4xl font-normal text-gray-900 mb-8 tracking-tight capitalize">Your Wishlist</h1>

      {/* Main Structural Workspace - Pure Borderless Layout */}
      <div className="w-full bg-white min-h-[45vh] flex flex-col">
        {displayItems.length === 0 ? (
          
          <div className="flex-grow flex flex-col items-center justify-center p-8 py-12 text-center animate-in fade-in duration-500">
            <div className="flex items-center justify-center w-14 h-14 mb-5 bg-stone-50 border border-gray-100 rounded-full">
              <Heart className="w-5 h-5 text-gray-400" strokeWidth={1.8} />
            </div>
            <h2 className="text-[27px] font-normal text-gray-900 tracking-tight mb-2 capitalize">Your Wishlist Is Empty</h2>
            <p className="text-[15px] text-gray-400 font-normal mb-8 max-w-sm mx-auto leading-relaxed capitalize">
              Save your favorite premium organic henna selections here to revisit them later.
            </p>
            <Link
              href="/products"
              className="h-11 px-8 bg-black hover:bg-stone-900 text-white rounded-full text-[14px] font-semibold tracking-wide transition-colors flex items-center justify-center capitalize shadow-none"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          
          /* Active Saved Collections Item Strip Matrix */
          <>
            <div className="pb-4 border-b border-gray-100 mb-2">
              <h2 className="text-[18px] font-normal text-gray-500 tracking-tight normal">
                Saved items <span className="text-md font-normal text-gray-400 ml-1">({displayItems.length} Products)</span>
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-gray-50">
              {displayItems.map((item) => {
                const product = item.product
                const displayPrice = product.retail_price ?? 0
                const mrp = product.mrp ?? 0

                const rawImage = product.images?.[0]
                const imageUrl = !rawImage 
                  ? '/placeholder-product.svg' 
                  : (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : getPublicUrl(rawImage))

                return (
                  <div 
                    key={item.wishlist_id} 
                    className="py-8 bg-white flex flex-row gap-6 sm:gap-8 relative group transition-colors"
                  >
                    {/* Media Item Snapshot Card */}
                    <Link href={`/product/${product.slug}`} className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-stone-50/50 border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center p-1.5">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 96px, 112px"
                        className="object-contain mix-blend-multiply p-1.5 transition-transform duration-500 group-hover:scale-101"
                        unoptimized={imageUrl.startsWith('http')}
                      />
                    </Link>

                    {/* Metadata Context Segment Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Link href={`/product/${product.slug}`} className="text-[16px] sm:text-[18px] font-bold text-gray-900 hover:text-gray-500 line-clamp-2 leading-snug mb-2 pr-12 transition-colors capitalize tracking-tight">
                        {product.name}
                      </Link>

                      {/* Micro Review Badging Indicators */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex items-center gap-0.5 bg-stone-50 border border-gray-100 text-gray-700 px-1.5 py-0.5 rounded-[4px] text-[11px] font-bold leading-none">
                          <span>{product.rating ?? 4.5}</span>
                          <Star className="w-3 h-3 fill-gray-900 text-gray-900" strokeWidth={0} />
                        </div>
                        <span className="text-[13px] text-gray-400 font-medium">
                          ({product.review_count ?? 128})
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[16px] sm:text-[18px] font-bold text-gray-900">
                          {formatCurrency(displayPrice)}
                        </span>
                        {mrp > displayPrice && (
                          <span className="text-[13px] text-gray-400 line-through font-medium">
                            {formatCurrency(mrp)}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-center gap-4">
                        <Link href={`/product/${product.slug}`} className="h-9 px-5 bg-black text-white text-[13px] font-semibold rounded-full hover:bg-stone-900 transition-colors flex items-center justify-center capitalize">
                          View Product
                        </Link>
                      </div>
                    </div>

                    {/* Absolute Delete Action Trash Glyph Trigger */}
                    <div className="absolute top-8 right-0">
                      <button
                        onClick={(e) => handleRemove(product.id, e)}
                        className="w-9 h-9 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center outline-none"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>

                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}