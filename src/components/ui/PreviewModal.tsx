// src/components/ui/PreviewModal.tsx

'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string | null
  fileName?: string
}

export default function PreviewModal({ isOpen, onClose, fileUrl, fileName }: PreviewModalProps) {
  const [mounted, setMounted] = useState(false)
  const [scale, setScale] = useState(1)

  // Wait for the document body to be ready for the Portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock background scrolling and reset zoom when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setScale(1)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Do not render anything until client-side hydration is complete
  if (!isOpen || !fileUrl || !mounted) return null

  const isPdf = fileUrl.split('?')[0].toLowerCase().endsWith('.pdf')

  // Zoom Controllers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5))

  const modalContent = (
    <div className="z-[99999] flex flex-col bg-[#0A0A0A]/95 backdrop-blur-md animate-in fade-in duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      
      {/* 📱 Header Bar - Guaranteed to be visible above everything */}
      <div className="flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/90 to-transparent z-50 shadow-sm">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-base md:text-lg font-bold text-white truncate drop-shadow-md">Artwork Preview</h3>
          {fileName && <p className="text-xs md:text-sm text-gray-300 truncate drop-shadow-md">{fileName}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Zoom Controls (Hidden for PDFs as browsers handle PDF zoom natively) */}
          {!isPdf && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full p-1 backdrop-blur-sm">
              <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-white w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Native "Open" Button (Best for Mobile Pinch-to-Zoom) */}
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer backdrop-blur-sm" 
            title="Open Full Size for Native Zoom"
          >
            <ExternalLink className="w-5 h-5" />
          </a>

          {/* The Big Red Close Button */}
          <button 
            onClick={onClose} 
            className="p-2.5 bg-red-500/90 hover:bg-red-600 rounded-full text-white transition-all shadow-lg cursor-pointer ml-1" 
            aria-label="Close preview"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 🖼️ Content Body - 100dvh safe, allows panning when zoomed */}
      <div className="flex-1 overflow-auto overscroll-contain relative flex items-center justify-center p-2 md:p-8 w-full h-full">
         {isPdf ? (
           <iframe 
             src={`${fileUrl}#toolbar=0`} 
             className="w-full h-full max-w-5xl rounded-xl bg-white shadow-2xl border border-white/10" 
             title="PDF Preview" 
           />
         ) : (
           <div className="relative w-full h-full flex items-center justify-center overflow-auto overscroll-contain touch-pan-x touch-pan-y">
             <img
                src={fileUrl}
                alt={fileName || "Preview"}
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'center', 
                  transition: 'transform 0.2s ease-out' 
                }}
                className="max-w-full max-h-full object-contain drop-shadow-2xl cursor-zoom-in"
                onClick={handleZoomIn}
              />
           </div>
         )}
      </div>
    </div>
  )

  // 🚨 MAGIC HAPPENS HERE: Mounts the modal directly to the <body> tag, bypassing the Navbar trap
  return createPortal(modalContent, document.body)
}