// src/app/(auth)/layout.tsx

'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  // Pages that need full‑width layout (no centering)
  const fullWidthPages = ['/login']
  const isFullWidth = fullWidthPages.includes(pathname)
  
  if (isFullWidth) {
    return <>{children}</>
  }
  
  // Default centred layout for other auth pages
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}