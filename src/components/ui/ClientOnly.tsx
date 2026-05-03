// src/components/ui/ClientOnly.tsx

'use client'

import { useEffect, useState, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode  // optional placeholder (e.g., skeleton)
}

/**
 * Renders children ONLY after client-side hydration is complete.
 * Perfect for components that depend on localStorage, sessionStorage, 
 * browser APIs, or dynamic user state that differs between server and client.
 * 
 * @example
 * <ClientOnly fallback={<div className="h-20 animate-pulse" />}>
 *   <PrintingOptions b2bState={...} onChange={...} />
 * </ClientOnly>
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? <>{children}</> : <>{fallback}</>
}