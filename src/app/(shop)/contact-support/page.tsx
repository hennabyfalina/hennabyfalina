// src/app/(shop)/contact-support/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { 
  Phone, Mail, MapPin, Send, HelpCircle, Package, 
  RefreshCw, ChevronRight, CreditCard, Truck, MessageCircle, Clock 
} from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.message) return

    const phone = siteConfig.contact.phone.primary.replace(/\D/g, '')
    const text = `*New Request from ${siteConfig.name} Support Hub*\n\n` +
      `*Name:* ${formData.name}\n` +
      (formData.email ? `*Email:* ${formData.email}\n` : '') +
      (formData.orderNumber ? `*Order #:* ${formData.orderNumber}\n` : '') +
      (formData.subject ? `*Subject:* ${formData.subject}\n` : '') +
      `\n*Message:* ${formData.message}`

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  // Curated FAQ array for clean rendering without heavy cards
  const faqs = [
    {
      question: "How do I track my order dispatch details?",
      answer: "Log securely into your user account details workspace to review active shipments. Real-time updates and tracking reference paths are also transmitted via automated WhatsApp notifications."
    },
    {
      question: "What is your studio replacement and defect guarantee?",
      answer: "We offer a strict 7-day repair or replacement policy specifically for manufacturing flaws originating from our facility layout prior to third-party logistics transit operations."
    },
    {
      question: "Can I modify my packaging specifications after ordering?",
      answer: "Customization parameters can only be altered if requested prior to the start of our production cycle. Once manufacturing begins, layouts are locked and cannot be adjusted."
    },
    {
      question: "Which secured transaction gateways are supported?",
      answer: "Our direct checkout interface fully supports encrypted UPI transactions, all major Credit or Debit cards, and secure Netbanking parameters powered directly by Razorpay."
    }
  ]

  return (
    <div className="min-h-screen bg-white py-8 md:py-14 select-none font-sans antialiased text-left pb-24">
      <Container className="max-w-[1100px] px-4 sm:px-8">
        
        {/* Breadcrumb Navigation Track */}
        <div className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1">
          <Link href="/">Home</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Contact & Support</span>
        </div>
        
        {/* Page Title Block Section */}
        <div className="mb-10 pb-2">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">Contact & Support</h1>
        </div>

        {/* Master Two-Column Grid Setup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT AREA: QUICK HELP LINK CHANNELS & INTERACTIVE FEEDBACK SLATE          */}
          {/* ========================================================================= */}
          <div className="md:col-span-2 space-y-14">
            
            {/* Quick Help Link Grid Options */}
            <section suppressHydrationWarning>
              <h2 className="text-[22px] font-normal text-gray-950 tracking-tight mb-5 capitalize">Quick Assistance Hubs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <Link href="/profile/orders" className="flex gap-4 p-5 border border-gray-100 rounded-2xl bg-white transition-all group outline-none">
                  <div className="w-10 h-10 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-black group-hover:text-white text-gray-400">
                    <Package className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h3 className="font-normal text-gray-900 text-[16px] tracking-tight capitalize">Track Packages</h3>
                    <p className="text-[13px] text-gray-400 font-normal capitalize">Review live order tracking and batch dispatch statuses</p>
                  </div>
                </Link>

                <Link href="/returns-refunds" className="flex gap-4 p-5 border border-gray-100 rounded-2xl bg-white transition-all group outline-none">
                  <div className="w-10 h-10 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-black group-hover:text-white text-gray-400">
                    <RefreshCw className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h3 className="font-normal text-gray-900 text-[16px] tracking-tight capitalize">Returns & Exchanges</h3>
                    <p className="text-[13px] text-gray-400 font-normal capitalize">Review our 7-day manufacturing defect policy guidelines</p>
                  </div>
                </Link>

                <Link href="/profile/payments" className="flex gap-4 p-5 border border-gray-100 rounded-2xl bg-white transition-all group outline-none">
                  <div className="w-10 h-10 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-black group-hover:text-white text-gray-400">
                    <CreditCard className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h3 className="font-normal text-gray-900 text-[16px] tracking-tight capitalize">Payments & Billing</h3>
                    <p className="text-[13px] text-gray-400 font-normal capitalize">Verify secured invoices powered by Razorpay channels</p>
                  </div>
                </Link>

                <Link href="/shipping" className="flex gap-4 p-5 border border-gray-100 rounded-2xl bg-white transition-all group outline-none">
                  <div className="w-10 h-10 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 transition-colors group-hover:bg-black group-hover:text-white text-gray-400">
                    <Truck className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h3 className="font-normal text-gray-900 text-[16px] tracking-tight capitalize">Shipping Guidelines</h3>
                    <p className="text-[13px] text-gray-400 font-normal capitalize">Review localized transit timelines and complimentary threshold rules</p>
                  </div>
                </Link>

              </div>
            </section>

            {/* Frequently Asked Questions: Clean, Borderless List Layout */}
            <section className="border-t border-gray-100 pt-10">
              <h2 className="text-[22px] font-normal text-gray-950 tracking-tight mb-5 capitalize">Frequently Asked Questions</h2>
              <div className="flex flex-col w-full">
                {faqs.map((faq, index) => (
                  <div key={index} className="py-5 first:pt-0 last:pb-0 space-y-1.5 capitalize">
                    <h3 className="font-semibold text-gray-950 text-[15px] tracking-tight">{faq.question}</h3>
                    <p className="text-[14px] text-gray-400 font-normal leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Direct Escalation Messaging Form Field Stream */}
            <section className="border-t border-gray-100 pt-10">
              <h2 className="text-[26px] font-normal text-gray-950 tracking-tight mb-1.5 normal">Send Us A Message</h2>
              <p className="text-[15px] text-gray-400 font-normal mb-8 leading-relaxed normal">
                Can&apos;t find an instantaneous answer above? Supply your details below, and our support team will connect with your session directly.
              </p>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-[15px] font-semibold text-gray-700 mb-1 capitalize">Your Name <span className="text-red-500 font-normal">*</span></label>
                    <input 
                      id="contact-name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      type="text" 
                      placeholder="Full Name" 
                      className="w-full h-11 bg-transparent border-b border-gray-200 focus:border-gray-950 outline-none text-[15px] font-normal text-gray-950 transition-colors placeholder:text-gray-400 capitalize" 
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-[15px] font-semibold text-gray-700 mb-1 capitalize">Email Address</label>
                    <input 
                      id="contact-email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      type="email" 
                      placeholder="email@example.com" 
                      className="w-full h-11 bg-transparent border-b border-gray-200 focus:border-gray-950 outline-none text-[15px] font-normal text-gray-950 transition-colors placeholder:text-gray-400" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-order" className="block text-[15px] font-semibold text-gray-700 mb-1 capitalize">Order Number <span className="font-normal text-gray-300 text-xs">(Optional)</span></label>
                    <input 
                      id="contact-order" 
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      type="text" 
                      placeholder="e.g. RPC-12345-ABCDE" 
                      className="w-full h-11 bg-transparent border-b border-gray-200 focus:border-gray-950 outline-none text-[15px] font-normal text-gray-950 transition-colors placeholder:text-gray-400" 
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-[15px] font-semibold text-gray-700 mb-2 capitalize">Inquiry Subject <span className="text-red-500 font-normal">*</span></label>
                    <div className="relative">
                      <select
                        id="contact-subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full h-11 bg-transparent border-b border-gray-200 focus:border-gray-950 outline-none text-[15px] font-normal text-gray-900 transition-colors appearance-none cursor-pointer rounded-none normal"
                      >
                        <option value="" disabled className="text-gray-400">Select an options topic</option>
                        <option value="Order Tracking">Order tracking parameters</option>
                        <option value="Bulk Purchase">Bulk quantities & wholesale</option>
                        <option value="Custom Design">Custom studio packaging</option>
                        <option value="Defect Replacement">Defect replacement claim</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-[15px] font-semibold text-gray-700 mb-1 capitalize">Message Details <span className="text-red-500 font-normal">*</span></label>
                  <textarea 
                    id="contact-message" 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3} 
                    placeholder="How can our studio team help you today?" 
                    className="w-full pt-3 bg-transparent border-b border-gray-200 focus:border-gray-950 outline-none text-[15px] font-normal text-gray-950 transition-colors placeholder:text-gray-400 resize-none min-h-[80px]"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="h-11 px-7 bg-black hover:bg-stone-900 text-white rounded-full text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 capitalize cursor-pointer shadow-none outline-none active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4 text-white/90" strokeWidth={1.8} />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT AREA: FIXED STUDIO CONTACT INFORMATION REFERENCE GRID PANEL          */}
          {/* ========================================================================= */}
          {/* Core Contact Metadata Panel Track (Right Column) */}
          <div className="md:col-span-1 md:sticky md:top-28">
            <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-none flex flex-col gap-6">
              <h3 className="font-normal text-gray-950 text-[27px] tracking-tight border-b border-gray-50 pb-3 normal">Get in Touch</h3>
              <div className="space-y-6">
                
                {/* Phone Link block */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                    <Phone className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-0.5 text-[14px] sm:text-[15px] font-medium text-gray-500 normal">
                    <div className="font-semibold text-gray-950 mb-0.5">Call us</div>
                    <p className="tracking-wide text-gray-900 font-normal">{siteConfig.contact.phone.primary}</p>
                    {siteConfig.contact.phone.secondary && (
                      <p className="tracking-wide text-gray-900 font-normal">{siteConfig.contact.phone.secondary}</p>
                    )}
                  </div>
                </div>

                {/* Email Link block */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                    <Mail className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-0.5 text-[14px] sm:text-[15px] font-medium text-gray-500 normal">
                    <div className="font-semibold text-gray-950 mb-0.5">Email us</div>
                    <p className="text-gray-900 font-normal normal-case">{siteConfig.contact.email.support}</p>
                  </div>
                </div>

                {/* Physical Head Office Block layout */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                    <MapPin className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-0.5 text-[14px] sm:text-[15px] font-medium text-gray-500 normal">
                    <div className="font-semibold text-gray-950 mb-1">Home location</div>
                    <p className="leading-relaxed font-normal text-gray-900">
                      {siteConfig.address.line1},<br />
                      {siteConfig.address.line2},<br />
                      {siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}<br />
                    </p>
                  </div>
                </div>

                {/* Keyless Native Google Maps App Deep-Link Trigger */}
                <div className="w-full h-[160px] rounded-2xl overflow-hidden border border-gray-100 bg-stone-50/50 relative group transition-all">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${siteConfig.name} ${siteConfig.address.line1} ${siteConfig.address.city} ${siteConfig.address.pincode}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex flex-col items-center justify-center gap-2 outline-none p-4"
                  >
                    {/* Clean background design lines to emulate a minimal map grid feel without loading heavy scripts */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors duration-200 shadow-none z-10">
                      <MapPin className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div className="text-center z-10 space-y-0.5">
                      <span className="text-[14px] font-semibold text-gray-900 block capitalize">
                        Open Home Location
                      </span>
                    </div>
                  </a>
                </div>

                {/* WhatsApp Chat Trigger */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                    <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-0.5 text-[14px] sm:text-[15px] font-medium text-gray-500 normal">
                    <div className="font-semibold text-gray-950 mb-1">WhatsApp chat</div>
                    <a 
                      href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-normal text-gray-950 hover:underline underline-offset-4"
                    >
                      Lets Talk
                    </a>
                  </div>
                </div>

                {/* Operating Timeline Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                    <Clock className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-0.5 text-[14px] sm:text-[15px] font-medium text-gray-500 normal">
                    <div className="font-semibold text-gray-950 mb-1 capitalize">Support hours</div>
                    <p className="text-gray-900 font-normal">{siteConfig.business.workingHours}</p>
                    <p className="text-[12px] text-gray-400 font-normal capitalize">Standard response within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </Container>
    </div>
  )
}