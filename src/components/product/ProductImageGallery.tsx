// src/components/product/ProductImageGallery.tsx

'use client'

import { useState, useRef, MouseEvent, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Mobile touch states
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)
  const [pinchDist, setPinchDist] = useState<number | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [fsZoomOrigin, setFsZoomOrigin] = useState('50% 50%')
  
  const imageRef = useRef<HTMLDivElement>(null)
  const mainImage = images[selectedIndex] || '/placeholder-product.svg'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset zoom when changing images
  useEffect(() => {
    setZoomScale(1)
  }, [selectedIndex])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100))
    setZoomOrigin(`${x}% ${y}%`)
  }

  // 🚨 Double Tap to Zoom Logic
  const lastTapAt = useRef<number>(0)
  const handleDoubleTapZoom = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    if (zoomScale > 1) {
      setZoomScale(1)
    } else {
      const rect = currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
      setFsZoomOrigin(`${x}% ${y}%`)
      setZoomScale(2.5)
    }
  }

  // 🚨 Native Mobile Pinch & Swipe Logic
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setPinchDist(dist)
    } else if (e.touches.length === 1) {
      setTouchEndX(null)
      setTouchStartX(e.touches[0].clientX)
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const newScale = Math.min(Math.max(1, zoomScale * (dist / pinchDist)), 4) // Max 4x zoom
      setZoomScale(newScale)
      setPinchDist(dist)
    } else if (e.touches.length === 1) {
      setTouchEndX(e.touches[0].clientX)
    }
  }

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setPinchDist(null)
    
    const now = Date.now()
    if (now - lastTapAt.current < 300) {
      // It's a double tap! Trigger Zoom and prevent swipe check
      handleDoubleTapZoom(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.currentTarget)
      lastTapAt.current = 0
      return
    }
    lastTapAt.current = now

    // If currently pinched/zoomed in, don't trigger swipe changes
    if (zoomScale > 1) return

    if (!touchStartX || !touchEndX) return
    const distance = touchStartX - touchEndX
    if (distance > minSwipeDistance && selectedIndex < images.length - 1) setSelectedIndex(prev => prev + 1)
    if (distance < -minSwipeDistance && selectedIndex > 0) setSelectedIndex(prev => prev - 1)
  }

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleDoubleTapZoom(e.clientX, e.clientY, e.currentTarget)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFullscreen(false)
      if (e.key === 'ArrowRight' && selectedIndex < images.length - 1) setSelectedIndex(prev => prev + 1)
      if (e.key === 'ArrowLeft' && selectedIndex > 0) setSelectedIndex(prev => prev - 1)
    }
    if (showFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [showFullscreen, selectedIndex, images.length])

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar w-full md:w-[60px] flex-shrink-0 order-2 md:order-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                onMouseEnter={() => setSelectedIndex(idx)}
                title={`View ${productName} image ${idx + 1}`}
                className={`relative w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 border bg-white ${
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

        <div
          ref={imageRef}
          className="relative aspect-square w-full bg-white rounded-md overflow-hidden group order-1 md:order-2 border border-gray-100 cursor-zoom-in"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => {
            setIsZoomed(false)
            setZoomOrigin('50% 50%')
          }}
          onMouseMove={handleMouseMove}
          onClick={() => setShowFullscreen(true)}
        >
          <Image
            src={mainImage}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
            className={`object-contain transition-transform duration-150 ease-out`}
            style={{
              transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
              transformOrigin: zoomOrigin,
            }}
            priority
          />
        </div>
      </div>

      {showFullscreen && mounted && createPortal(
        <div className="fixed inset-0 z-[999999] bg-white flex flex-col w-screen h-[100dvh] animate-in fade-in duration-200">
          
          <div className="absolute top-0 right-0 left-0 p-4 sm:p-6 flex justify-end z-[1000000] pointer-events-none">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowFullscreen(false)
              }}
              className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 bg-white border border-gray-300 shadow-xl rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-100 active:bg-gray-200 transition-all focus:outline-none"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          <div 
            className="flex-1 relative bg-white flex items-center justify-center overflow-hidden w-full h-full touch-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onDoubleClick={onDoubleClick}
          >
            {selectedIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(s => s - 1); }}
                className="absolute left-2 sm:left-6 z-[1000] p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-md border border-gray-200 text-gray-800 transition-colors focus:outline-none hidden md:flex"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            <div className="relative w-full h-[85vh] max-w-5xl">
              <Image
                src={mainImage}
                alt={productName}
                fill
                sizes="100vw"
                unoptimized={mainImage.includes('token=') || mainImage.includes('supabase')}
                className="object-contain select-none p-4 transition-transform duration-75"
                draggable={false}
                priority
                style={{ 
                  transform: `scale(${zoomScale})`, 
                  transformOrigin: fsZoomOrigin,
                  transition: pinchDist ? 'none' : 'transform 0.2s ease-out' 
                }} // 🚨 Pinch and Double Tap to Zoom Applied here
              />
            </div>

            {selectedIndex < images.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(s => s + 1); }}
                className="absolute right-2 sm:right-6 z-[1000] p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-md border border-gray-200 text-gray-800 transition-colors focus:outline-none hidden md:flex"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-[1000]">
              <div className="flex gap-3 overflow-x-auto no-scrollbar max-w-5xl mx-auto justify-start sm:justify-center px-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-full overflow-hidden transition-all duration-200 border-2 bg-white ${
                      selectedIndex === idx ? 'border-[#e77600] shadow-md' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${productName} - view ${idx + 1}`}
                      fill
                      sizes="80px"
                      unoptimized={img.includes('token=') || img.includes('supabase')}
                      className="object-contain p-1 rounded-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}