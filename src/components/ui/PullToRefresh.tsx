// src/components/ui/PullToRefresh.tsx

'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface PullToRefreshProps {
  children: ReactNode
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const router = useRouter()

  const MAX_PULL_DISTANCE = 120 
  const REFRESH_THRESHOLD = 70  

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        currentY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || startY.current === 0) return
      
      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (window.scrollY === 0 && distance > 0) {
        if (e.cancelable) e.preventDefault() 
        
        const pull = Math.min(distance * 0.4, MAX_PULL_DISTANCE)
        setPullDistance(pull)
      } else if (distance < 0) {
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return
      setIsPulling(false)

      if (pullDistance >= REFRESH_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(REFRESH_THRESHOLD) 
        
        router.refresh()
        
        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
          startY.current = 0
        }, 1000)
      } else {
        setPullDistance(0)
        startY.current = 0
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, isRefreshing, router])

  return (
    <div ref={containerRef} className="w-full relative flex-1 flex flex-col">
      <div 
        className="fixed top-16 left-0 right-0 flex justify-center z-[100] pointer-events-none md:hidden"
        style={{ 
          transform: `translateY(${pullDistance > 0 ? pullDistance : -50}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
          transition: isPulling ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'
        }}
      >
        <div 
          className={`w-10 h-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-200 flex items-center justify-center text-[#e77600] ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4}deg)` }}
        >
          {isRefreshing ? (
             <div className="w-5 h-5 border-2 border-gray-300 border-t-[#e77600] rounded-full" />
          ) : (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}