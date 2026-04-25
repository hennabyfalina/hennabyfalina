'use client'

import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TrackingTimelineProps {
  status: string
}

export default function TrackingTimeline({ status }: TrackingTimelineProps) {
  const [progress, setProgress] = useState(0)
  const isCancelled = status === 'cancelled'

  const steps = [
    { id: 1, name: 'Ordered', statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] },
    { id: 2, name: 'Processing', statuses: ['processing', 'shipped', 'delivered'] },
    { id: 3, name: 'Shipped', statuses: ['shipped', 'delivered'] },
    { id: 4, name: 'Delivered', statuses: ['delivered'] }
  ]

  const currentStepIndex = isCancelled ? -1 : steps.findLastIndex(step => step.statuses.includes(status))

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

  return (
    <div className="w-full">
      {/* DESKTOP: Horizontal Timeline */}
      <div className="hidden md:block relative w-full max-w-4xl mx-auto py-8 px-6">
        <div className="absolute left-[12.5%] right-[12.5%] top-1/2 transform -translate-y-1/2 h-2 bg-gray-200 z-0 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#067D62] transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center gap-3 w-1/4 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-500 delay-200 z-10 
                  ${isCompleted ? 'bg-[#067D62] border-2 border-[#067D62]' : 'bg-gray-200 border-2 border-white'} 
                  ${isCurrent ? 'ring-4 ring-[#067D62]/30 scale-110' : ''}`
                }>
                  {isCompleted && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </div>
                <span className={`text-sm font-bold text-center transition-colors duration-500 delay-200 
                  ${isCurrent ? 'text-[#067D62]' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`
                }>{step.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* MOBILE: Vertical Timeline */}
      <div className="block md:hidden relative w-full py-4 pl-4 pr-2">
        <div className="absolute left-[27px] top-6 bottom-8 w-1.5 bg-gray-200 z-0 overflow-hidden">
          <div
            className="absolute left-0 top-0 w-full bg-[#067D62] transition-all duration-1000 ease-out"
            style={{ height: `${progress}%` }}
          ></div>
        </div>

        <div className="flex flex-col gap-8 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.id} className="flex items-center gap-4 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-500 delay-200 z-10 
                  ${isCompleted ? 'bg-[#067D62] border-2 border-[#067D62]' : 'bg-gray-200 border-2 border-white'} 
                  ${isCurrent ? 'ring-4 ring-[#067D62]/30 scale-110' : ''}`
                }>
                  {isCompleted && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold transition-colors duration-500 delay-200 
                    ${isCurrent ? 'text-[#067D62]' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`
                  }>{step.name}</span>
                  {isCurrent && <span className="text-xs text-gray-500 mt-0.5">Your package is currently {step.name.toLowerCase()}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}