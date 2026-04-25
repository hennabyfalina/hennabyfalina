// src/components/product/ProductImageGallery.tsx

'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const mainImage = images[selectedIndex] || '/placeholder-product.svg'

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Thumbnails (Left on desktop, Bottom on mobile) */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar w-full md:w-[60px] flex-shrink-0 order-2 md:order-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              onMouseEnter={() => setSelectedIndex(idx)}
              title={`View ${productName} image ${idx + 1}`}
              className={`relative w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] flex-shrink-0 rounded-sm overflow-hidden transition-all duration-200 border bg-white ${
                selectedIndex === idx ? 'border-[#e77600] shadow-[0_0_4px_rgba(231,118,0,0.5)]' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} - view ${idx + 1}`}
                fill
                sizes="60px"
                unoptimized={img.includes('token=') || img.includes('supabase')}
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        className="relative aspect-square w-full bg-white rounded-sm overflow-hidden group order-1 md:order-2 border border-gray-100"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <Image
          src={mainImage}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
          className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-in' : 'scale-100 cursor-default'}`}
          priority
        />
      </div>
    </div>
  )
}