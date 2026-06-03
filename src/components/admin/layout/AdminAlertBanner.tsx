// src/components/admin/layout/AdminAlertBanner.tsx

'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface AdminAlertBannerProps {
  isSuperAdmin: boolean
}

export default function AdminAlertBanner({ isSuperAdmin }: AdminAlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isSuperAdmin || isDismissed) return null

  return (
    <div 
      className="sticky top-0 z-[9999] w-full shrink-0 text-center py-2.5 px-4 text-xs font-medium flex items-center justify-between gap-2 overflow-hidden border-b"
      style={{
        backgroundColor: 'var(--admin-bg-card)',
        borderColor: 'var(--admin-border)',
        color: 'var(--admin-warning)'
      }}
    >
      <div className="flex-1 flex items-center justify-center gap-2 flex-wrap min-w-0">
        <AlertTriangle 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: 'var(--admin-warning)' }}
        />
        
        <span className="font-semibold truncate" style={{ color: 'var(--admin-text-primary)' }}>
          Limited Permissions
        </span>
        
        <span className="hidden sm:inline whitespace-nowrap" style={{ color: 'var(--admin-text-secondary)' }}>
          Contact super admin to request full access.
        </span>
        
        <button 
          onClick={() => window.open('mailto:admin@razackpackagingcentre.com')}
          className="px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
          style={{
            backgroundColor: 'var(--admin-bg-elevated)',
            color: 'var(--admin-warning)',
            border: '1px solid var(--admin-border)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--admin-bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--admin-bg-elevated)'
          }}
        >
          Request Access
        </button>
      </div>

      {/* Dismiss button - always visible on desktop, hidden on mobile if needed */}
      <button
        onClick={() => setIsDismissed(true)}
        className="flex-shrink-0 p-1 rounded-full hover:admin-bg-elevated transition-colors cursor-pointer ml-2"
        aria-label="Dismiss banner"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}