// src/config/useIdleTimeout.ts

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useIdleTimeout(timeoutMinutes: number = 30) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      // Clear admin gate cookie and redirect
      document.cookie = 'admin_gate_passed=; path=/; max-age=0'
      router.push('/admin-gate?reason=timeout')
    }, timeoutMinutes * 60 * 1000)
  }

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer()
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
}