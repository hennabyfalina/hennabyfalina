// src/components/order/TrackingTimeline.tsx

'use client'

import { useEffect, useState } from 'react'
import { Truck, Store, ExternalLink, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { siteConfig } from '@/config/site'

interface TrackingTimelineProps {
  status: string
  isPickup?: boolean
  courierName?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  shippedAt?: string | null
}

export default function TrackingTimeline({ 
  status, 
  isPickup = false,
  courierName,
  trackingNumber,
  trackingUrl,
  shippedAt
}: TrackingTimelineProps) {
  const [progress, setProgress] = useState(0)
  const isCancelled = status === 'cancelled'

  // Apple-Standard 4-Node Linear Assembly Tracks
  const steps = isPickup ? [
    { id: 1, name: 'Order Placed', statuses: ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up'] },
    { id: 2, name: 'Processing', statuses: ['processing', 'ready_for_pickup', 'picked_up'] },
    { id: 3, name: 'Ready for Pickup', statuses: ['ready_for_pickup', 'picked_up'] },
    { id: 4, name: 'Picked Up', statuses: ['picked_up', 'delivered'] }
  ] : [
    { id: 1, name: 'Order Placed', statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup', 'picked_up'] },
    { id: 2, name: 'Processing', statuses: ['processing', 'shipped', 'delivered', 'ready_for_pickup', 'picked_up'] },
    { id: 3, name: 'Shipped', statuses: ['shipped', 'delivered', 'ready_for_pickup', 'picked_up'] },
    { id: 4, name: 'Delivered', statuses: ['delivered', 'picked_up'] }
  ]

  const currentStepIndex = isCancelled 
    ? -1 
    : steps.reduce((acc, step, idx) => step.statuses.includes(status) ? Math.max(acc, idx) : acc, 0)

  useEffect(() => {
    if (!isCancelled) {
      const timer = setTimeout(() => {
        setProgress(Math.max(0, (currentStepIndex / (steps.length - 1)) * 100))
      }, 100) 
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex, isCancelled, steps.length])

  if (isCancelled) {
    return (
      <div className="p-4 bg-stone-50 border border-stone-100 text-stone-500 rounded-xl text-xs font-semibold capitalise tracking-wider text-left">
        This order has been cancelled.
      </div>
    )
  }

  const showTrackingDetails = !isPickup && (status === 'shipped' || status === 'delivered') && (courierName || trackingNumber)
  const showPickupDetails = isPickup && (status === 'ready_for_pickup' || status === 'picked_up')

  return (
    <div className="w-full text-left select-none font-sans antialiased">
      
      {/* ========================================================= */}
      {/* 🏛️ APPLE-STYLE STEP TRACK PROGRESS LINE                   */}
      {/* ========================================================= */}
      <div className="relative mt-8 mb-12 max-w-xl mx-auto px-2 flex flex-col md:block">
        {/* Base Timeline Background Rail */}
        <div className="absolute top-2 left-4 right-4 h-[2px] bg-stone-100 z-0 hidden md:block" />
        
        {/* Active Progress Overlay Line */}
        <div className="absolute top-2 left-4 right-4 h-[2px] z-0 hidden md:block">
          <div 
            className="absolute top-0 left-0 h-full bg-gray-950 transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        {/* Nodes Grid Track */}
        <div className="relative flex flex-col md:flex-row justify-between w-full z-10 gap-8 md:gap-0">
          {/* Vertical Rail for Mobile */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-stone-100 md:hidden" />
          <div 
            className="absolute left-[11px] top-2 w-[2px] bg-gray-950 transition-all duration-1000 ease-out md:hidden" 
            style={{ height: `${progress}%` }} 
          />

          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex

            return (
              <div key={step.id} className="flex flex-row md:flex-col items-center relative md:w-6 gap-4 md:gap-0">
                {/* Micro Node Circle */}
                <div className="h-6 w-6 md:h-4 md:w-4 bg-white flex items-center justify-center rounded-full z-10">
                  <div 
                    className={`h-3 w-3 md:h-2.5 md:w-2.5 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-gray-950 scale-100' : 'bg-stone-200 scale-90'
                    }`} 
                  />
                </div>
                {/* Node Typography Metadata Label */}
                <div className="md:absolute md:top-6 flex flex-col items-start md:items-center">
                  <span 
                    className={`text-[12px] md:text-[11px] whitespace-nowrap capitalise tracking-wider transition-colors duration-200 ${
                      isCurrent ? 'text-gray-950 font-bold' : isCompleted ? 'text-gray-900 font-medium' : 'text-stone-300 font-medium'
                    }`}
                  >
                    {step.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-gray-400 font-medium md:hidden">Current Status</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📦 METRICS SUMMARY CARDS: HOME DELIVERY RUNS               */}
      {/* ========================================================= */}
      {showTrackingDetails && (
        <div className="mt-14 max-w-xl mx-auto bg-stone-50/40 border border-stone-100 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
          <h4 className="text-gray-950 font-bold text-[12px] capitalise tracking-wider mb-4 pb-2 border-b border-stone-100 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-gray-950" strokeWidth={2.2} />
            <span>Delivery Tracking</span>
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-3.5 text-xs font-semibold text-gray-400">
              <div>
                <p className="text-[10px] capitalise tracking-wider mb-0.5">Carrier Partner</p>
                <p className="text-[13px] font-bold text-gray-950">{courierName}</p>
              </div>
              <div>
                <p className="text-[10px] capitalise tracking-wider mb-0.5">Tracking Number / AWB</p>
                <div className="inline-flex items-center gap-1.5 mt-0.5">
                  <p className="text-[12px] font-mono font-bold text-gray-950 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                    {trackingNumber}
                  </p>
                </div>
              </div>
              {shippedAt && (
                <div>
                  <p className="text-[10px] capitalise tracking-wider mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Shipped Date
                  </p>
                  <p className="text-[13px] font-bold text-gray-950">{formatDate(shippedAt)}</p>
                </div>
              )}
            </div>
            
            <div className="w-full flex sm:justify-end">
              {trackingUrl ? (
                <a 
                  href={trackingUrl.startsWith('http') ? trackingUrl : `https://${trackingUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-5 bg-black hover:bg-stone-900 text-white text-[11px] font-bold capitalise tracking-wider rounded-full flex items-center justify-center gap-1.5 transition-all outline-none active:scale-[0.99] w-full sm:w-auto cursor-pointer"
                >
                  <span>Track Package</span>
                  <ExternalLink className="w-3 h-3" strokeWidth={2.2} />
                </a>
              ) : (
                <div className="text-[11px] font-semibold text-stone-400 italic bg-white px-3 py-2 rounded-lg border border-stone-100 text-center w-full">
                  Copy AWB code to track on carrier website.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏪 METRICS SUMMARY CARDS: HUB STUDIO PICKUPS              */}
      {/* ========================================================= */}
      {showPickupDetails && (
        <div className="mt-14 max-w-xl mx-auto bg-stone-50/40 border border-stone-100 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
          <h4 className="text-gray-950 font-bold text-[12px] capitalise tracking-wider mb-4 pb-2 border-b border-stone-100 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-gray-950" strokeWidth={2.2} />
            <span>Pickup Verification</span>
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="text-xs font-semibold text-gray-400">
              <p className="text-[10px] capitalise tracking-wider mb-0.5">Pickup Location</p>
              <p className="text-[13px] font-bold text-gray-950">{siteConfig.name}</p>
              <p className="text-[12px] text-gray-500 font-medium leading-normal mt-0.5">
                {siteConfig.address.line1}, {siteConfig.address.line2}<br />
                {siteConfig.address.city} - {siteConfig.address.pincode}
              </p>
            </div>
            
            <div className="w-full flex sm:justify-end">
              <div 
                className={`h-9 px-4 rounded-full text-[11px] font-bold capitalise tracking-wider flex items-center justify-center border w-full sm:w-auto ${
                  status === 'picked_up' 
                    ? 'bg-stone-100 text-stone-600 border-stone-200/60' 
                    : 'bg-black text-white border-transparent'
                }`}
              >
                {status === 'picked_up' ? 'Order Picked Up' : 'Ready For Collection'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}