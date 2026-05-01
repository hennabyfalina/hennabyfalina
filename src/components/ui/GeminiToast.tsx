// src/components/ui/GeminiToast.tsx

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, XCircle, Sparkles } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai'

interface GeminiToastProps {
  message: string
  type?: ToastType
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function GeminiToast({ message, type = 'info', isVisible, onClose, duration = 3000 }: GeminiToastProps) {
  const [isRendered, setIsRendered] = useState(false)

  // Handle the mounting/unmounting animation states safely
  useEffect(() => {
    if (isVisible) {
      setIsRendered(true)
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      // Delay unmounting to allow fade-out animation to finish
      const timer = setTimeout(() => setIsRendered(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isRendered) return null

  // 🚨 STRICT GEMINI GLOWING DICTIONARY
  const styleMap = {
    success: { icon: CheckCircle2, color: 'text-green-400', glow: 'shadow-[0_0_12px_rgba(74,222,128,0.2)]' },
    error: { icon: XCircle, color: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(248,113,113,0.2)]' },
    warning: { icon: AlertTriangle, color: 'text-[#F9AB00]', glow: 'shadow-[0_0_12px_rgba(249,171,0,0.2)]' }, // AWS/Gemini Orange
    info: { icon: Info, color: 'text-[#A8C7FA]', glow: 'shadow-[0_0_12px_rgba(168,199,250,0.2)]' }, // Gemini Blue
    ai: { icon: Sparkles, color: 'text-[#A8C7FA]', glow: 'shadow-[0_0_12px_rgba(168,199,250,0.4)]' }
  }

  const { icon: Icon, color, glow } = styleMap[type]

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div 
        className={`
          flex items-center gap-3 px-5 py-3 
          bg-[#1E1F20] border border-[#333538] rounded-full 
          shadow-2xl ${glow}
          transition-all duration-300 ease-out
          ${isVisible ? 'animate-in slide-in-from-bottom-4 fade-in opacity-100 translate-y-0' : 'animate-out slide-out-to-bottom-4 fade-out opacity-0 translate-y-4'}
        `}
      >
        <Icon className={`w-5 h-5 ${color} shrink-0`} />
        <span className="text-sm font-medium text-[#E3E3E3] tracking-wide whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  )
}