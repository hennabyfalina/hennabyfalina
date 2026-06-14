// src/components/product/ShareModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, QrCode, Share2, Check } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'
import QRCode from 'qrcode'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  productUrl: string
}

interface ShareOption {
  id: string
  name: string
  icon: string
  url: (url: string, title: string) => string
  color?: string
}

const shareOptions: ShareOption[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png',
    url: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
    url: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'x',
    name: 'X',
    icon: 'https://cdn-icons-png.flaticon.com/512/5969/5969020.png',
    url: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png',
    url: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'https://cdn-icons-png.flaticon.com/512/3955/3955024.png',
    url: (url, title) => `https://www.instagram.com/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
    url: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968534.png',
    url: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
]

export default function ShareModal({ isOpen, onClose, productName, productUrl }: ShareModalProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && showQR) {
      QRCode.toDataURL(productUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error)
    }
  }, [isOpen, showQR, productUrl])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl)
      setCopied(true)
      showToast('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy link', 'error')
    }
  }

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: productName, url: productUrl }).catch(console.error)
    } else {
      handleCopyLink()
    }
    onClose()
  }

  const handleShare = (option: ShareOption) => {
    const shareUrl = option.url(productUrl, productName)
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500')
    onClose()
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-base font-normal text-gray-900">Share this product</h3>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer rounded-full"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Product name preview */}
          <div className="bg-stone-50/60 rounded-xl p-3 border border-gray-100">
            <p className="text-sm text-gray-400 mb-1">Product</p>
            <p className="text-sm font-normal text-gray-800 line-clamp-2">{productName}</p>
          </div>

          {/* QR Code Section */}
          {showQR ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                {qrCodeDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-stone-50 animate-pulse rounded-lg" />
                )}
              </div>
              <button
                onClick={() => setShowQR(false)}
                className="text-sm font-normal text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Hide QR Code
              </button>
            </div>
          ) : (
            <>
              {/* Social Grid - 4 columns */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Share Via</p>
                <div className="grid grid-cols-4 gap-3">
                  {shareOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleShare(option)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center group-hover:bg-white transition-all bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={option.icon}
                          alt={option.name}
                          className={`w-full h-full object-cover ${option.id === 'linkedin' || option.id === 'email' ? 'scale-75' : ''}`}
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[11px] font-normal text-gray-500">{option.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Row: Copy Link + QR Code + More */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-400 mb-3">Or</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-xl text-sm font-normal text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
                    ) : (
                      <Copy className="w-4 h-4" strokeWidth={1.5} />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => setShowQR(true)}
                    className="flex-1 h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-xl text-sm font-normal text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" strokeWidth={1.5} />
                    <span>QR Code</span>
                  </button>

                  {typeof navigator !== 'undefined' && !!navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 h-11 flex items-center justify-center gap-2 border border-gray-200 rounded-xl text-sm font-normal text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" strokeWidth={1.5} />
                      <span>More</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}