// src/components/checkout/StorePickupInfo.tsx

'use client'

import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { MapPin, Clock, Phone, Mail, Copy, Check, Navigation } from 'lucide-react'

export default function StorePickupInfo() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const textToCopy = `${siteConfig.name}\nAddress: ${siteConfig.address.line1}, ${siteConfig.address.line2}, ${siteConfig.address.city} - ${siteConfig.address.pincode}, ${siteConfig.address.state}, ${siteConfig.address.country}\nHours: ${siteConfig.business.workingHours}\nPhone: ${siteConfig.contact.phone.primary}\nEmail: ${siteConfig.contact.email.orders}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy studio credentials', err)
    }
  }

  const mapQuery = encodeURIComponent(`${siteConfig.name} ${siteConfig.address.line1} ${siteConfig.address.city}`)
  const mapUrl = `https://maps.google.com/?q=${mapQuery}`

  return (
    <div className="w-full text-left font-sans antialiased space-y-6 animate-fade-in select-none">
      
      {/* 🌟 FIXED: Upscaled text weights and enforced pure Capitalized typography layouts */}
      <div className="space-y-1">
        <h3 className="text-[16px] sm:text-[17px] font-semibold text-gray-900 capitalize">Home Pickup Details</h3>
        <p className="text-[13px] sm:text-[14px] text-gray-400 font-normal normal">Pick up your order directly from our home.</p>
      </div>
      
      {/* 🚀 FIXED: Rebuilt into a crisp hairline division list with proper capital case letters and clear fonts */}
      <div className="w-full max-w-xl divide-y divide-gray-100 text-[15px] sm:text-[15px] text-gray-600 font-normal">
        
        <div className="flex items-start gap-3.5 py-4 first:pt-0">
          <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" strokeWidth={1.8} />
          <div className="leading-relaxed capitalize">
            <p className="font-semibold text-gray-950 text-[15px]">{siteConfig.name}</p>
            <p className="text-gray-500 mt-1 leading-normal font-normal">
              {siteConfig.address.line1},<br />
              {siteConfig.address.line2},<br />
              {siteConfig.address.city} – {siteConfig.address.pincode}, {siteConfig.address.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3.5 py-4">
          <Clock className="w-4.5 h-4.5 text-gray-400 shrink-0" strokeWidth={1.8} />
          <p className="capitalize font-normal"><span className="text-gray-400 font-normal mr-1">Hours:</span> {siteConfig.business.workingHours}</p>
        </div>
        
        <div className="flex items-center gap-3.5 py-4">
          <Phone className="w-4.5 h-4.5 text-gray-400 shrink-0" strokeWidth={1.8} />
          <p className="capitalize font-normal">
            <span className="text-gray-400 font-normal mr-1">Phone:</span> 
            <span className="tracking-wide text-gray-800 font-normal">{siteConfig.contact.phone.primary} {siteConfig.contact.phone.secondary ? `| ${siteConfig.contact.phone.secondary}` : ''}</span>
          </p>
        </div>

        <div className="flex items-center gap-3.5 py-4 last:pb-2 min-w-0">
          <Mail className="w-4.5 h-4.5 text-gray-400 shrink-0" strokeWidth={1.8} />
          <p className="truncate text-gray-500 font-normal">
            <span className="text-gray-400 font-normal mr-1">Email:</span> 
            <span className="text-gray-800 font-normal">{siteConfig.contact.email.orders}</span>
          </p>
        </div>
        
      </div>

      {/* Action Handle Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="h-11 px-5 flex items-center justify-center gap-2 text-[14px] font-semibold text-gray-600 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors cursor-pointer capitalize shadow-none"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} /> : <Copy className="w-4 h-4 text-gray-400" strokeWidth={1.8} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        
        {/* Primary directional trigger button left solid black as required */}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 px-6 flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-black hover:bg-stone-900 rounded-full transition-colors capitalize tracking-wide shadow-none"
        >
          <Navigation className="w-4 h-4" strokeWidth={1.8} />
          <span>Get Directions</span>
        </a>
      </div>
      
    </div>
  )
}