// src/components/product/ProductImageGallery.tsx

'use client'

import { useSyncExternalStore } from 'react'
import { useState, useRef, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { getPublicUrl } from '@/lib/supabase/storage'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  priority?: boolean
}

export default function ProductImageGallery({ images, productName, priority = false }: ProductImageGalleryProps) {
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
    <div className="flex flex-col gap-4 select-none">
      {/* Main Large Display Canvas */}
      <div 
        ref={imageRef}
        className="relative aspect-[4/5] w-full bg-stone-50/40 border border-gray-100 rounded-2xl cursor-zoom-in group overflow-hidden"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setShowFullscreen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full h-full relative">
          <Image
            src={mainImage}
            alt={productName}
            fill 
            priority={priority}
            sizes="(max-width: 768px) 100vw, 40vw"
            unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
            className="object-contain p-4 transition-transform duration-300 ease-out"
            style={{
              transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
              transformOrigin: zoomOrigin
            }}
          />
        </div>
        
        <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full border border-gray-100 shadow-sm text-gray-400 group-hover:text-gray-900 transition-all hidden md:flex items-center gap-1.5 cursor-pointer">
          <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} /> 
          <span className="text-[10px] font-medium tracking-widest uppercase">Enlarge</span>
        </div>
      </div>

      {/* Thumbnails Track Strip Grid */}
      {images.length > 1 && (
        <div className="flex flex-row gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 max-w-full touch-pan-x">
          {formattedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 border bg-stone-50/30 cursor-pointer ${
                selectedIndex === idx ? 'border-gray-900 scale-102 shadow-sm' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} item image ${idx + 1}`}
                fill
                sizes="80px"
                unoptimized={img.includes('token=') || img.includes('supabase')}
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Portal Overlays Sheet */}
      {isMounted && showFullscreen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center p-5 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white/80 to-transparent">
            <span className="text-[11px] font-medium tracking-widest text-gray-400 uppercase bg-stone-50 px-3 py-1 rounded-full border border-gray-100">
              {selectedIndex + 1} / {images.length}
            </span>
            <button 
              onClick={() => {
                setShowFullscreen(false)
                setZoomScale(1)
              }} 
              className="p-2.5 bg-white hover:bg-stone-50 border border-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
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
                className="absolute left-4 sm:left-8 z-10 p-3 bg-white hover:bg-stone-50 transition-colors border border-gray-100 rounded-full cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
              </button>
            )}
            
            <div className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center p-6 sm:p-12">
              <Image
                src={mainImage}
                alt={productName}
                fill
                unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
                className="object-contain p-2 transition-transform duration-200"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: fsZoomOrigin
                }}
              />
            </div>

            {images.length > 1 && selectedIndex < images.length - 1 && zoomScale === 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-4 sm:right-8 z-10 p-3 bg-white hover:bg-stone-50 transition-colors border border-gray-100 rounded-full cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Fullscreen Bottom View Thumbnails Track */}
          {images.length > 1 && (
            <div className="p-5 bg-white border-t border-gray-50 flex justify-center gap-3 overflow-x-auto no-scrollbar">
              {formattedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative w-14 h-16 sm:w-16 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden transition-all border-2 cursor-pointer bg-stone-50/30 ${
                    selectedIndex === idx ? 'border-gray-900 scale-102 shadow-sm' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Fullscreen layout strip gallery thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    unoptimized={img.includes('token=') || img.includes('supabase')}
                    className="object-contain p-2"
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