'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'

interface InvoiceLinkProps {
  orderId: string
  orderNumber?: string
  className?: string
}

export default function InvoiceLink({ orderId, orderNumber, className }: InvoiceLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadInvoice = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/invoice/${orderId}`)
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice_${orderNumber || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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
      className={className || 'text-[#007185] hover:text-[#C7511F] hover:underline disabled:opacity-50'}
    >
      {isDownloading ? 'Downloading...' : 'Invoice'}
    </button>
  )
}
