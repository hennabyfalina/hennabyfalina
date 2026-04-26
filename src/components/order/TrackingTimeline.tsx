'use client'

import { useEffect, useState } from 'react'

interface TrackingTimelineProps {
  status: string
  isPickup?: boolean
}

export default function TrackingTimeline({ status, isPickup = false }: TrackingTimelineProps) {
  const [progress, setProgress] = useState(0)
  const isCancelled = status === 'cancelled'

  const steps = isPickup ? [
    { id: 1, name: 'Ordered', statuses: ['pending', 'confirmed', 'processing', 'ready_for_pickup'] },
    { id: 2, name: 'Picked Up', statuses: ['picked_up', 'delivered'] }
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
      }, 100) // Small delay to trigger the CSS transition
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

  return (
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
  )
}