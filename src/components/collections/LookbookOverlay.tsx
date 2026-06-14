// src/components/collections/LookbookOverlay.tsx

'use client'

import Image from 'next/image'
import { X, ChevronLeft, Clock, Sparkles, Layers } from 'lucide-react'
import InquiryForm from './InquiryForm'

interface DesignItem {
  id: string
  name: string
  image: string
  description?: string
  estimated_time?: string
  complexity?: string
  price_range?: string
}

interface LookbookOverlayProps {
  design: DesignItem | null
  collectionName: string
  onClose: () => void
}

export default function LookbookOverlay({ design, collectionName, onClose }: LookbookOverlayProps) {
  if (!design) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Immersive Sidebar Drawer Container Panel Sheet */}
      <div
        className="w-full max-w-[550px] h-full bg-white flex flex-col overflow-y-auto p-6 sm:p-10 text-left animate-in slide-in-from-right-8 duration-300 ease-out shadow-none border-l border-stone-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Operational Header Navigation Row */}
        <div className="flex items-center justify-start pb-5 mb-6">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-950 transition-colors flex items-center gap-1.5 text-[13px] font-bold tracking-tight normal cursor-pointer outline-none border-none bg-transparent group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
            <span>Back</span>
          </button>
        </div>

        {/* Central Component Information Frame Stream */}
        <div className="flex-1 space-y-8">
          {/* Left-Aligned Primary Typographic Blocks */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-normal text-gray-950 tracking-tight capitalize">
              {design.name.toLowerCase()}
            </h2>
            {design.description && (
              <p className="text-[14px] text-gray-400 font-medium capitalize leading-relaxed">
                {design.description}
              </p>
            )}
          </div>

          {/* Full Bleed High-Contrast Image Container Asset */}
          <div className="w-full aspect-[4/5] relative bg-stone-50 border border-stone-100 rounded-3xl overflow-hidden flex items-center justify-center">
            <Image
              src={design.image}
              alt={design.name}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Apple-Style Un-boxed Technical Grid Specification Matrix */}
          <div className="grid grid-cols-3 gap-4 border-y border-stone-100 py-6 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Duration</span>
              </div>
              <p className="text-[14px] font-semibold text-gray-950 capitalize">
                {design.estimated_time || '2–3 Hours'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Intricacy</span>
              </div>
              <p className="text-[14px] font-semibold text-gray-950 capitalize">
                {design.complexity || 'High Detail'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Layers className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Estimate</span>
              </div>
              <p className="text-[14px] font-bold text-gray-950 capitalize">
                {design.price_range || 'Tier Quote'}
              </p>
            </div>
          </div>

          {/* Bottom Interactive Action Footer Target Zone */}
          <div className="space-y-4">
            <InquiryForm 
              design={design} 
              collectionName={collectionName} 
              onSuccess={onClose} 
            />
          </div>
        </div>

        <div className="mt-8 pb-20 sm:pb-8">
          <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed capitalize">
            Application timelines and investment margins are estimates. Final implementation specifications are verified directly by our studio artist during your active session consultation.
          </p>
        </div>

      </div>
    </div>
  )
}