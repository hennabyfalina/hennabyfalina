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
      className="h-9 px-4 bg-stone-50 border border-transparent hover:border-stone-200 text-gray-900 font-semibold rounded-xl transition-all text-[13px] flex items-center justify-center gap-2 print:hidden disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] outline-none capitalize"
    >
      {isDownloading ? (
        <div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      ) : (
        <FileText className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
      )}
      <span>{isDownloading ? 'Generating...' : 'Invoice'}</span>
    </button>
  )
}