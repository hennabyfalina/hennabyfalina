// src/components/order/ArtworkDownloadButton.tsx

'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

interface ArtworkDownloadButtonProps {
  url: string
  index: number
  className?: string
}

export default function ArtworkDownloadButton({ url, index, className }: ArtworkDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isDownloading) return

    try {
      setIsDownloading(true)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      
      // Attempt to extract filename from URL or fallback
      let filename = `Artwork-File-${index + 1}`
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')
        const lastPart = pathParts[pathParts.length - 1]
        if (lastPart) filename = decodeURIComponent(lastPart).split('?')[0]
      } catch (e) {}

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      
      showToast("Download Successfully. Check your device's download section.", 'success')
    } catch (error) {
      console.error('Error downloading artwork:', error)
      showToast('Failed to download artwork file.', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={className || "inline-flex items-center gap-1.5 font-bold text-[#007185] hover:text-[#C7511F] hover:underline transition-colors disabled:opacity-50 cursor-pointer"}
    >
      {isDownloading ? (
        <><div className="w-3 h-3 border-2 border-[#007185] border-t-transparent rounded-full animate-spin" /> Fetching...</>
      ) : (
        <><Download className="w-3 h-3" /> Download File {index + 1}</>
      )}
    </button>
  )
}