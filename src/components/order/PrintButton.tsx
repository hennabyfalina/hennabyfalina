// src/components/order/PrintButton.tsx

'use client'

import { Download, FileText } from 'lucide-react'
import { useState } from 'react'

interface PrintButtonProps {
  orderId?: string
  orderNumber?: string
  invoiceType?: 'customer' | 'merchant'
}

export default function PrintButton({ orderId, orderNumber, invoiceType = 'customer' }: PrintButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePrint = async () => {
    if (orderId) {
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
      document.title = `Invoice-${orderNumber}`
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
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#D5D9D9] rounded-md text-sm font-bold text-[#0F1111] hover:bg-[#F7FAFA] active:bg-[#EDF2F2] shadow-sm print:hidden transition-all duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {isDownloading ? (
        <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span>{isDownloading ? 'Generating PDF...' : 'Download Tax Invoice'}</span>
    </button>
  )
}