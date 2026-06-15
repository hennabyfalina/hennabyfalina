// src/components/home/ContactSection.tsx

'use client'

import { Mail, Phone } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useState } from 'react'

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleWhatsAppRedirect = (e: React.FormEvent) => {
    e.preventDefault()
    const text = `Hello! My name is ${formData.name}.\nAbout: ${formData.email}\n\n${formData.message}`
    const encodedText = encodeURIComponent(text)
    const whatsappUrl = `https://wa.me/${siteConfig.contact.phone.primary.replace(/[^0-9]/g, '')}?text=${encodedText}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="w-full bg-white py-6 px-1 select-none font-sans" suppressHydrationWarning>
      {/* Removed screaming uppercase letters and aggressive tracking bounds */}
      <h2 className="text-2xl sm:text-4xl font-normal text-gray-950 tracking-tight text-left mb-10">
        Connect With Us
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start" suppressHydrationWarning>
        
        {/* Left Sub-column: Fluid Brand Text Node Area */}
        <div className="lg:col-span-5 space-y-6 text-left" suppressHydrationWarning>
          <p className="text-[16px] text-gray-500 font-normal leading-relaxed">
            Have questions about batch freshness, bulk custom cones, shipping timelines, or ordering specific organic raw mixtures? Drop us a message to our studio team responds quickly.
          </p>
          
          <div className="space-y-4 pt-2" suppressHydrationWarning>
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-stone-50/60 flex items-center justify-center text-gray-500 border border-gray-100/80">
                <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <p className="text-[12px] font-normal text-gray-400 lowercase">whatsapp &amp; calls</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <a href={`https://wa.me/${siteConfig.contact.phone.primary.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[15px] font-normal text-gray-950 hover:text-blue-600 transition-colors">
                    {siteConfig.contact.phone.primary}
                  </a>
                  <span className="hidden sm:inline text-gray-200 text-xs">|</span>
                  <a href={`https://wa.me/${siteConfig.contact.phone.secondary.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[15px] font-normal text-gray-950 hover:text-blue-600 transition-colors">
                    {siteConfig.contact.phone.secondary}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-stone-50/60 flex items-center justify-center text-gray-500 border border-gray-100/80">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <p className="text-[12px] font-normal text-gray-400 lowercase">email support</p>
                <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-[15px] font-normal text-gray-950 hover:text-blue-600 transition-colors mt-0.5">
                  {siteConfig.contact.email.orders}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sub-column: Refined Editorial Input Forms */}
        <div className="lg:col-span-7 w-full bg-white transition-all text-left" suppressHydrationWarning>
          <form className="space-y-4 w-full" onSubmit={handleWhatsAppRedirect}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Your name" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 px-0 bg-transparent border-b border-gray-200 text-[15px] font-normal text-gray-900 placeholder-gray-400 focus:border-gray-950 outline-none transition-colors duration-200" 
              />
              <input 
                type="email" 
                placeholder="Email address" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-12 px-0 bg-transparent border-b border-gray-200 text-[15px] font-normal text-gray-900 placeholder-gray-400 focus:border-gray-950 outline-none transition-colors duration-200" 
              />
            </div>
            
            <textarea 
              placeholder="How can our henna studio help you today?" 
              rows={3} 
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-0 py-3 bg-transparent border-b border-gray-200 text-[15px] font-normal text-gray-900 placeholder-gray-400 focus:border-gray-950 outline-none transition-colors duration-200 resize-none" 
            />
            
            <div className="pt-3">
              <button type="submit" className="h-12 px-10 bg-gray-950 text-white text-[13px] font-medium tracking-wider rounded-full hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]">
                <span>Send message</span>
                
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}