// src/components/home/ContactSection.tsx

'use client'

import { Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function ContactSection() {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] mb-8">
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6">Need help with an order?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-md text-gray-600 mb-6">
            Our customer service team is here to assist you with tracking, bulk orders, and custom packaging queries.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-md text-gray-700">
              <Phone className="w-5 h-5 text-gray-400" />
              <a 
                href={`https://wa.me/${siteConfig.contact.phone.primary.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#C7511F] hover:underline"
              >
                {siteConfig.contact.phone.primary}
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href={`https://wa.me/${siteConfig.contact.phone.secondary.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#C7511F] hover:underline"
              >
                {siteConfig.contact.phone.secondary}
              </a>
            </div>
            <div className="flex items-center gap-3 text-md text-gray-700">
              <Mail className="w-5 h-5 text-gray-400" />
              <a href={`mailto:${siteConfig.contact.email.orders}`} className="hover:text-[#C7511F] hover:underline">
                {siteConfig.contact.email.orders}
              </a>
            </div>
            <div className="flex items-center gap-3 text-md text-gray-700">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.country}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Send us a message</h3>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              placeholder="Name" 
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
            />
            <textarea 
              placeholder="How can we help?" 
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none resize-none"
            />
            <button className="w-full py-2 bg-gray-900 text-white text-sm font-bold rounded-sm hover:bg-gray-800 transition-colors shadow-sm">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}