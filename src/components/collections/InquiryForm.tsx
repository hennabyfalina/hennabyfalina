// src/components/collections/InquiryForm.tsx

'use client'

import { useState } from 'react'
import { Calendar, Users, Sparkles, Send } from 'lucide-react'
import { siteConfig } from '@/config/site'

interface DesignItem {
  id: string
  name: string
  price_range?: string
}

interface InquiryFormProps {
  design: DesignItem
  collectionName: string
  onSuccess?: () => void
}

export default function InquiryForm({ design, collectionName, onSuccess }: InquiryFormProps) {
  const [bookingData, setBookingData] = useState({
    eventDate: '',
    sessionType: 'Bridal',
    guestCount: '1'
  })

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const phone = siteConfig.contact.phone.primary.replace(/\D/g, '')
    
    const text = `*New Studio Availability Booking Request*\n\n` +
      `*Lookbook:* ${collectionName}\n` +
      `*Design Pattern:* ${design.name}\n` +
      (design.price_range ? `*Price Matrix:* ${design.price_range}\n` : '') +
      `\n*--- Event Parameters ---*\n` +
      `*Target Date:* ${bookingData.eventDate ? bookingData.eventDate : 'To Be Confirmed'}\n` +
      `*Session Profile:* ${bookingData.sessionType}\n` +
      `*Guest Count:* ${bookingData.guestCount} Person(s)\n\n` +
      `Hello! I am reviewing your design portfolio and would love to verify artist availability for my upcoming session.`

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
    
    if (onSuccess) onSuccess()
  }

  return (
    <form onSubmit={handleActionSubmit} className="space-y-5 text-left">
      
      {/* Event Date Picker Selector Input */}
      <div>
        <label htmlFor="event-date" className="block text-[13px] font-semibold text-gray-400 mb-1.5 capitalize">
          Target Event Date
        </label>
        <div className="relative flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" strokeWidth={1.8} />
          <input
            id="event-date"
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            value={bookingData.eventDate}
            onChange={(e) => setBookingData({ ...bookingData, eventDate: e.target.value })}
            className="w-full h-11 pl-10 pr-4 bg-stone-50 border border-stone-100/80 focus:border-gray-950 focus:bg-white rounded-xl outline-none text-[14px] font-semibold text-gray-900 transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Two-Column Selector Fields Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Session Type Select Dropdown */}
        <div>
          <label htmlFor="session-type" className="block text-[13px] font-semibold text-gray-400 mb-1.5 capitalize">
            Session Profile
          </label>
          <div className="relative flex items-center">
            <Sparkles className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" strokeWidth={1.8} />
            {/* 🚀 FIXED: Injected inline URL micro-chevron vectors to ensure cross-device visibility with zero layout shifts */}
            <select
              id="session-type"
              value={bookingData.sessionType}
              onChange={(e) => setBookingData({ ...bookingData, sessionType: e.target.value })}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a8a29e' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'calc(100% - 12px) 50%', backgroundSize: '14px' }}
              className="w-full h-11 pl-10 pr-8 bg-stone-50 border border-stone-100/80 focus:border-gray-950 focus:bg-white rounded-xl outline-none text-[14px] font-semibold text-gray-900 transition-all appearance-none bg-no-repeat cursor-pointer capitalize"
            >
              <option value="Bridal">Bridal Session</option>
              <option value="Sangeet / Mehendi">Sangeet Event</option>
              <option value="Engagement">Engagement</option>
              <option value="Family / Party">Guest Party</option>
            </select>
          </div>
        </div>

        {/* Guest Scaler Counter Selector Dropdown */}
        <div>
          <label htmlFor="guest-count" className="block text-[13px] font-semibold text-gray-400 mb-1.5 capitalize">
            Guest Counting
          </label>
          <div className="relative flex items-center">
            <Users className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" strokeWidth={1.8} />
            {/* 🚀 FIXED: Injected inline URL micro-chevron vectors to ensure cross-device visibility with zero layout shifts */}
            <select
              id="guest-count"
              value={bookingData.guestCount}
              onChange={(e) => setBookingData({ ...bookingData, guestCount: e.target.value })}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a8a29e' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'calc(100% - 12px) 50%', backgroundSize: '14px' }}
              className="w-full h-11 pl-10 pr-8 bg-stone-50 border border-stone-100/80 focus:border-gray-950 focus:bg-white rounded-xl outline-none text-[14px] font-semibold text-gray-900 transition-all appearance-none bg-no-repeat cursor-pointer"
            >
              <option value="1">1 Person (Solo)</option>
              <option value="2-5">2 – 5 Guests</option>
              <option value="5-10">5 – 10 Guests</option>
              <option value="10+">10+ Massive Group</option>
            </select>
          </div>
        </div>

      </div>

      {/* High-Contrast Core Action Button Submission Link */}
      <div className="pt-3">
        <button
          type="submit"
          className="w-full h-11 bg-black hover:bg-stone-900 text-white font-semibold rounded-full text-[14px] transition-all flex items-center justify-center gap-2 capitalize cursor-pointer shadow-none outline-none active:scale-[0.99]"
        >
          <Send className="w-4 h-4 text-white/90" strokeWidth={1.8} />
          <span>Check Availability & Secure Design</span>
        </button>
      </div>

    </form>
  )
}