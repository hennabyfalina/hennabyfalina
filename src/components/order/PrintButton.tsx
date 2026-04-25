'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'

interface PrintButtonProps {
  orderId?: string
  orderNumber?: string
}

export default function PrintButton({ orderId, orderNumber }: PrintButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePrint = async () => {
    if (orderId) {
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
        console.error('Error downloading PDF:', error)
        fallbackPrint()
      } finally {
        setIsDownloading(false)
      }
    } else {
      fallbackPrint()
    }
  }

  const fallbackPrint = () => {
    if (orderNumber) {
      const originalTitle = document.title
      document.title = `Invoice_${orderNumber}`
      window.print()
      document.title = originalTitle
    } else {
      window.print()
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={isDownloading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm print:hidden transition-colors disabled:opacity-50"
    >
      {isDownloading ? (
        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isDownloading ? 'Downloading...' : 'Download Invoice'}
    </button>
  )
}
