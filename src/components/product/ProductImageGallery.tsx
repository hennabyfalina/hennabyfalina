// src/components/product/ProductImageGallery.tsx

'use client'
import { useSyncExternalStore } from 'react'
import { useState, useRef, MouseEvent, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { getPublicUrl } from '@/lib/supabase/storage'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const [showFullscreen, setShowFullscreen] = useState(false)
  
  const isMounted = useSyncExternalStore(
    (callback) => { window.addEventListener('load', callback); return () => window.removeEventListener('load', callback) },
    () => true,
    () => false
  )
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)
  const [pinchDist, setPinchDist] = useState<number | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [lastTap, setLastTap] = useState(0)
  const [fsZoomOrigin, setFsZoomOrigin] = useState('50% 50%')
  
  const imageRef = useRef<HTMLDivElement>(null)
  
  // Format URLs
  const formattedImages = images.map(img => 
    img.startsWith('http') || img.startsWith('/') ? img : getPublicUrl(img)
  )
  const mainImage = formattedImages[selectedIndex] || '/placeholder-product.svg'

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (zoomScale > 1) {
        setZoomScale(1)
      } else {
        const touch = e.touches[0]
        const x = (touch.clientX / window.innerWidth) * 100
        const y = (touch.clientY / window.innerHeight) * 100
        setFsZoomOrigin(`${x}% ${y}%`)
        setZoomScale(2.5)
      }
    }
    setLastTap(now)
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX)
    } else if (e.touches.length === 2 && showFullscreen) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setPinchDist(dist)
      handleDoubleTap(e)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartX !== null) {
      setTouchEndX(e.touches[0].clientX)
    } else if (e.touches.length === 2 && pinchDist !== null && showFullscreen) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scale = Math.max(1, Math.min(3, zoomScale * (dist / pinchDist)))
      setZoomScale(scale)
      setPinchDist(dist)
      
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      setFsZoomOrigin(`${(centerX / window.innerWidth) * 100}% ${(centerY / window.innerHeight) * 100}%`)
    }
  }

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const diff = touchStartX - touchEndX
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextImage()
        else prevImage()
      }
    }
    setTouchStartX(null)
    setTouchEndX(null)
    setPinchDist(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:sticky lg:top-28">
      {/* Thumbnails (Left side on desktop, bottom on mobile) */}
      {images.length > 1 && (
        <div className="order-2 lg:order-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar py-2 lg:py-0 px-1 lg:px-0 lg:max-h-[500px]">
          {formattedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 sm:w-14 sm:h-14 flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 border bg-white cursor-pointer ${
                selectedIndex === idx ? 'border-[#007185] shadow-[0_0_4px_rgba(0,113,133,0.5)]' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="64px"
                unoptimized={img.includes('token=') || img.includes('supabase')}
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div 
        ref={imageRef}
        className="order-1 lg:order-2 flex-1 relative aspect-square w-full bg-white border border-gray-200 cursor-crosshair group overflow-hidden"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setShowFullscreen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full h-full relative cursor-crosshair">
          <Image
          src={mainImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
          className="object-contain transition-transform duration-200"
          style={{
            transform: isZoomed ? 'scale(2)' : 'scale(1)',
            transformOrigin: zoomOrigin
          }}
        />
        </div>
        
        {/* Fullscreen Hint */}
        <div className="absolute top-4 right-4 z-10 p-2 bg-white border border-gray-200 shadow-sm text-gray-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-2 pointer-events-auto cursor-pointer">
          <Maximize2 className="w-4 h-4" /> <span className="text-xs font-medium">Click to enlarge</span>
        </div>
      </div>

      {/* Fullscreen Portal */}
      {isMounted && showFullscreen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 sm:p-6 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-white/0">
            <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 border border-gray-200 shadow-sm">
              {selectedIndex + 1} of {images.length}
            </span>
            <button 
              onClick={() => {
                setShowFullscreen(false)
                setZoomScale(1)
              }} 
              className="p-2 sm:p-3 bg-white hover:bg-red-50 hover:border-red-200 group transition-all shadow-sm cursor-pointer border border-gray-200 rounded-full"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
          
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden touch-none"
            onTouchStart={(e) => {
              handleTouchStart(e)
              handleDoubleTap(e)
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 1 && selectedIndex > 0 && zoomScale === 1 && (
              <button 
                onClick={prevImage}
                className="absolute left-2 sm:left-6 z-10 p-3 sm:p-4 bg-white/80 hover:bg-white transition-colors border border-gray-200 shadow-sm rounded-full cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-[#0F1111]" />
              </button>
            )}
            
            <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center p-4 sm:p-12">
              <Image
                src={mainImage}
                alt={productName}
                fill
                unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
                className="object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: fsZoomOrigin
                }}
              />
            </div>

            {images.length > 1 && selectedIndex < images.length - 1 && zoomScale === 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-2 sm:right-6 z-10 p-3 sm:p-4 bg-white/80 hover:bg-white transition-colors border border-gray-200 shadow-sm rounded-full cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-[#0F1111]" />
              </button>
            )}
          </div>

          {/* Fullscreen Bottom Thumbnails */}
          {images.length > 1 && (
            <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
              {formattedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden transition-all border-2 cursor-pointer ${
                    selectedIndex === idx ? 'border-[#007185] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    fill
                    sizes="80px"
                    unoptimized={img.includes('token=') || img.includes('supabase')}
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}