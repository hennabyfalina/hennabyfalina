// src/components/admin/layout/AdminAlertBanner.tsx

'use client'

import { AlertTriangle } from 'lucide-react'

interface AdminAlertBannerProps {
  isSuperAdmin: boolean
}

export default function AdminAlertBanner({ isSuperAdmin }: AdminAlertBannerProps) {
  if (isSuperAdmin) return null

  return (
    <div 
      className="sticky top-0 z-[9999] w-full shrink-0 text-center py-2.5 px-4 text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap overflow-x-auto no-scrollbar border-b"
      style={{
        backgroundColor: 'var(--admin-bg-card)',
        borderColor: 'var(--admin-border)',
        color: 'var(--admin-warning)'
      }}
    >
      <AlertTriangle 
        className="w-4 h-4 flex-shrink-0" 
        style={{ color: 'var(--admin-warning)' }}
      />
      
      <span className="font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
        You are viewing with limited permissions.
      </span>
      
      <span className="hidden md:inline" style={{ color: 'var(--admin-text-secondary)' }}>
        Contact super admin to request full access.
      </span>
      
      <button 
        onClick={() => window.open('mailto:admin@razackpackagingcentre.com')}
        className="ml-2 px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer"
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
  )
}