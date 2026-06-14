// src/components/product/StarRating.tsx

import { Star, StarHalf } from 'lucide-react'

interface StarRatingProps {
  rating: number
  reviewCount: number
  className?: string
  size?: 'sm' | 'md'
  hideReviewCount?: boolean
}

export default function StarRating({ rating, reviewCount, className = '', size = 'sm', hideReviewCount = false }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className={`flex items-center gap-1.5 ${className}`} suppressHydrationWarning>
      <div className="flex text-[#FFA41C]" suppressHydrationWarning>
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className={`${starSize} fill-current`} />)}
        {hasHalfStar && <StarHalf className={`${starSize} fill-current`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />)}
      </div>
      <span className="text-[13px] font-bold text-gray-900">{rating.toFixed(1)}</span>
      {!hideReviewCount && (
        <span className="text-[13px] text-gray-400 font-normal">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  )
}