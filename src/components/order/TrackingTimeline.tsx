// src/components/order/TrackingTimeline.tsx

'use client'

import { useEffect, useState } from 'react'
import { Truck, ExternalLink, Calendar, Store, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { siteConfig } from '@/config/site'

interface TrackingTimelineProps {
  status: string
  isPickup?: boolean
  // 🚨 New Tracking Props 🚨
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

  // 🚨 SMART TIMELINE: 4 Steps for Delivery AND 4 Steps for Pickup
  const steps = isPickup ? [
    { id: 1, name: 'Ordered', statuses: ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up'] },
    { id: 2, name: 'Processing', statuses: ['processing', 'ready_for_pickup', 'picked_up'] },
    { id: 3, name: 'Ready', statuses: ['ready_for_pickup', 'picked_up'] },
    { id: 4, name: 'Picked Up', statuses: ['picked_up', 'delivered'] }
  ] : [
    { id: 1, name: 'Ordered', statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'ready_for_pickup', 'picked_up'] },
    { id: 2, name: 'Processing', statuses: ['processing', 'shipped', 'delivered', 'ready_for_pickup', 'picked_up'] },
    { id: 3, name: 'Shipped', statuses: ['shipped', 'delivered', 'ready_for_pickup', 'picked_up'] },
    { id: 4, name: 'Delivered', statuses: ['delivered', 'picked_up'] }
  ]

  const currentStepIndex = isCancelled ? -1 : steps.reduce((acc, step, idx) => step.statuses.includes(status) ? Math.max(acc, idx) : acc, 0)

  // Smooth animation effect on mount
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
      <div className="p-4 bg-red-50 text-red-700 rounded-md font-medium border border-red-100 text-sm">
        This order has been cancelled.
      </div>
    )
  }

  const isDeliveredOrPickedUp = status === 'delivered' || status === 'picked_up';
  
  // 🚨 UI Display Flags
  const showTrackingDetails = !isPickup && (status === 'shipped' || status === 'delivered') && (courierName || trackingNumber);
  const showPickupDetails = isPickup && (status === 'ready_for_pickup' || status === 'picked_up');

  return (
    <div className="w-full">
      <div className="relative mt-12 mb-10 max-w-2xl mx-auto">
        {/* Timeline Track Lines */}
        <div className="absolute top-3 left-4 right-4 h-[3px] bg-gray-200 z-0" />
        
        <div className="absolute top-3 left-4 right-4 h-[3px] z-0">
          <div 
            className="absolute top-0 left-0 h-[3px] bg-[#007185] transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        <div className="relative flex justify-between w-full z-10">
          {steps.map((step, index) => {
            const isPast = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center justify-center relative w-8">
                {/* Dot container */}
                <div className="h-6 w-6 bg-white flex items-center justify-center rounded-full z-10">
                  {isCurrent && !isDeliveredOrPickedUp ? (
                    <div className="relative flex h-full w-full items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-[#007185] opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#007185]"></span>
                    </div>
                  ) : (isPast || (isCurrent && isDeliveredOrPickedUp)) ? (
                    <div className="h-3 w-3 rounded-full bg-[#007185]" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                  )}
                </div>
                {/* Text */}
                <span className={`absolute top-8 text-xs md:text-sm whitespace-nowrap ${isPast || isCurrent ? 'text-[#007185] font-bold' : 'text-gray-500 font-medium'}`}>
                  {step.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 🚚 HOME DELIVERY TRACKING CARD */}
      {showTrackingDetails && (
        <div className="mt-12 max-w-2xl mx-auto bg-[#F7FAFA] border border-[#D5D9D9] rounded-lg p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-[#0F1111] font-bold text-sm mb-4 border-b border-[#D5D9D9] pb-2 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#007185]" />
            Dispatch Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Courier Partner</p>
                <p className="text-sm font-bold text-[#0F1111]">{courierName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Tracking ID / AWB</p>
                <p className="text-sm font-mono font-bold text-[#0F1111] bg-white border border-gray-200 px-2 py-1 rounded inline-block">{trackingNumber || 'N/A'}</p>
              </div>
              {shippedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Dispatched On
                  </p>
                  <p className="text-sm font-medium text-[#0F1111]">{formatDate(shippedAt)}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-end md:items-end">
              {trackingUrl ? (
                <a 
                  href={trackingUrl.startsWith('http') ? trackingUrl : `https://${trackingUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full text-sm font-medium text-[#0F1111] shadow-sm transition-all active:scale-95 w-full md:w-auto cursor-pointer"
                >
                  Track Package <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="text-xs text-gray-500 italic bg-white px-3 py-2 rounded border border-gray-200 text-center w-full md:w-auto">
                  Please copy the Tracking ID and check on the partner's website.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🏪 STORE PICKUP DETAILS CARD */}
      {showPickupDetails && (
        <div className="mt-12 max-w-2xl mx-auto bg-[#F7FAFA] border border-[#D5D9D9] rounded-lg p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-[#0F1111] font-bold text-sm mb-4 border-b border-[#D5D9D9] pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#007185]" />
            Store Pickup Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Store Branch</p>
                <p className="text-sm font-bold text-[#0F1111]">{siteConfig.name}</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {siteConfig.address.line1}, {siteConfig.address.line2}<br />
                  {siteConfig.address.city} - {siteConfig.address.pincode}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col justify-end md:items-end">
              <div className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-bold shadow-sm w-full md:w-auto ${status === 'picked_up' ? 'bg-gray-200 text-gray-700 border border-gray-300' : 'bg-[#D4EDDA] text-[#155724] border border-[#C3E6CB] animate-pulse'}`}>
                <CheckCircle2 className="w-5 h-5" /> 
                {status === 'picked_up' ? 'Successfully Picked Up' : 'Ready For Pickup Now'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}