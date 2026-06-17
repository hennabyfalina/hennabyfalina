// src/hooks/useCheckoutTimer.ts

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useCheckoutTimer(onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [isActive, setIsActive] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Pre-load audio to ensure zero-latency playback when the countdown hits 10
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/alert.mp3')
      audioRef.current.volume = 0.5
    }
  }, [])

  const startTimer = useCallback((minutes = 15, currentSignature?: string) => {
    const now = Date.now()
    let endTime = now + minutes * 60 * 1000
    
    // 🚀 SEAMLESS REFRESH: Resume timer if cart signature matches an ongoing session
    const storedEnd = sessionStorage.getItem('checkout_timer_end')
    const storedSig = sessionStorage.getItem('checkout_timer_sig')

    if (storedEnd && storedSig === currentSignature) {
      const parsedEnd = parseInt(storedEnd, 10)
      if (parsedEnd > now) endTime = parsedEnd
    }

    sessionStorage.setItem('checkout_timer_end', endTime.toString())
    if (currentSignature) sessionStorage.setItem('checkout_timer_sig', currentSignature)

    setTimeLeft(Math.max(0, Math.ceil((endTime - now) / 1000)))
    setIsActive(true)
  }, [])

  const stopTimer = useCallback(() => {
    setIsActive(false)
    sessionStorage.removeItem('checkout_timer_end')
    sessionStorage.removeItem('checkout_timer_sig')
  }, [])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      const storedEnd = sessionStorage.getItem('checkout_timer_end')
      if (!storedEnd) return

      const now = Date.now()
      const endTime = parseInt(storedEnd, 10)
      const remainingSec = Math.max(0, Math.ceil((endTime - now) / 1000))

      setTimeLeft(remainingSec)

      // 🔊 CONVERSION URGENCY: Play soft chime exclusively at the 10-second mark
      if (remainingSec === 10 && audioRef.current) {
        audioRef.current.play().catch(e => console.warn('Autoplay blocked by browser', e))
      }

      if (remainingSec <= 0) {
        clearInterval(interval)
        setIsActive(false)
        sessionStorage.removeItem('checkout_timer_end')
        sessionStorage.removeItem('checkout_timer_sig')
        onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, onExpire])

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const s = (timeLeft % 60).toString().padStart(2, '0')

  return { formattedTime: `${m}:${s}`, isExpired: timeLeft <= 0 && !isActive, startTimer, stopTimer }
}