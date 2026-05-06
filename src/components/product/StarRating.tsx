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
  
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'

  return (
    <div className={`flex items-center gap-1.5 ${className}`} suppressHydrationWarning>
      <div className="flex text-[#FFA41C]" suppressHydrationWarning>
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className={`${starSize} fill-current`} />)}
        {hasHalfStar && <StarHalf className={`${starSize} fill-current`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />)}
      </div>
      {!hideReviewCount && (
        <span className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer font-medium">
          {reviewCount.toLocaleString()} ratings
        </span>
      )}
    </div>
  )
}