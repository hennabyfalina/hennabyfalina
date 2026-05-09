// src/components/order/InvoiceLink.tsx

'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'
import { showToast } from '@/components/ui/Toast'

interface InvoiceLinkProps {
  orderId: string
  orderNumber?: string
  className?: string
  invoiceType?: 'customer' | 'merchant'
  textLabel?: string
}

export default function InvoiceLink({ orderId, orderNumber, className, invoiceType = 'customer', textLabel }: InvoiceLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadInvoice = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isDownloading) return;
    
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/invoice/${orderId}?type=${invoiceType}`)
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceType === 'merchant' ? 'Merchant-' : ''}Invoice-${orderNumber || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showToast("Download started. Check your device's download section.", 'success')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownloadInvoice}
      disabled={isDownloading}
      className={className || 'text-[#007185] hover:text-[#C7511F] hover:underline disabled:opacity-50 cursor-pointer transition-colors duration-200 active:scale-[0.98] text-sm font-medium flex items-center gap-1'}
    >
      {isDownloading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-[#007185] border-t-transparent rounded-full animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <span>{textLabel || 'Invoice'}</span>
      )}
    </button>
  )
}