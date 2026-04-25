'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageProps {
  imageUrl: string | null
  productName: string
  priority?: boolean
}

export default function ProductImage({ imageUrl, productName, priority = false }: ProductImageProps) {
  const [imgError, setImgError] = useState(false)

  const finalImageUrl = imgError || !imageUrl 
    ? '/placeholder-product.svg' 
    : imageUrl

  return (
    <div className="aspect-square bg-gray-50/50 sm:bg-gray-50 rounded-2xl overflow-hidden relative group">
      <Image
        src={finalImageUrl}
        alt={productName}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        unoptimized={finalImageUrl.includes('token=') || finalImageUrl.includes('supabase')}
        className="object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        priority={priority}
        onError={() => {
          setImgError(true)
        }}
      />
    </div>
  )
}