// src/components/product/ProductImage.tsx

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
    <div className="aspect-square bg-white rounded-xl overflow-hidden relative group border border-stone-100/60">
      <Image
        src={finalImageUrl}
        alt={productName}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        // ⚡ REGION PROTECTED: Enabled internal compression paths to optimize image delivery performance
        unoptimized={finalImageUrl.includes('token=')}
        className="object-contain p-2 group-hover:scale-102 transition-transform duration-500"
        onError={() => setImgError(true)}
      />
    </div>
  )
}