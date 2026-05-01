// src/components/checkout/StorePickupInfo.tsx

'use client'

import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { MapPin, Clock, Phone, Mail, Copy, Check, Navigation } from 'lucide-react'

export default function StorePickupInfo() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const textToCopy = `${siteConfig.name}\n${siteConfig.address.line1}, ${siteConfig.address.line2}, ${siteConfig.address.city}, ${siteConfig.address.state}\nHours: ${siteConfig.business.workingHours}\nPhone: ${siteConfig.contact.phone.primary}\nEmail: ${siteConfig.contact.email.orders}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address', err)
    }
  }

  const mapQuery = encodeURIComponent(`${siteConfig.name} ${siteConfig.address.line1} ${siteConfig.address.city}`)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`

  return (
    <div className="bg-white p-5 rounded-sm border border-[#D5D9D9] space-y-4">
      <h3 className="text-lg font-bold text-[#0F1111]">Store Details</h3>
      <p className="text-sm text-[#0F1111] mb-2">Pick up your order directly from our store for free.</p>
      
      <div className="bg-[#F0F2F2] rounded-sm p-4 space-y-3 border border-[#D5D9D9]">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#565959] flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold text-[15px] text-[#0F1111]">{siteConfig.name}</p>
            <p className="text-[15px] text-[#0F1111] leading-relaxed whitespace-pre-line mt-1">
              {siteConfig.address.line1},<br />
              {siteConfig.address.line2},<br />
              {siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.country} – {siteConfig.address.pincode}<br />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#565959] flex-shrink-0" />
          <p className="text-[15px] text-[#0F1111]">{siteConfig.business.workingHours}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-[#565959] flex-shrink-0" />
          <p className="text-[15px] text-[#0F1111]">{siteConfig.contact.phone.primary}</p>
          <p className="text-[15px] text-[#0F1111]">{siteConfig.contact.phone.secondary}</p>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-[#565959] flex-shrink-0" />
          <p className="text-[15px] text-[#0F1111]">{siteConfig.contact.email.orders}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-[#0F1111] bg-white border border-[#D5D9D9] rounded-sm hover:bg-gray-50 transition-colors shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-[#007600]" />
          ) : (
            <Copy className="w-4 h-4 text-[#565959]" />
          )}
          {copied ? <span className="text-[#007600]">Copied!</span> : 'Copy Details'}
        </button>
        
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-[#0F1111] bg-[#FFD814] border border-[#FCD200] hover:bg-[#F7CA00] rounded-sm transition-colors shadow-sm focus:ring-2 focus:ring-[#007185] focus:outline-none"
        >
          <Navigation className="w-4 h-4" />
          Get Directions
        </a>
      </div>
    </div>
  )
}