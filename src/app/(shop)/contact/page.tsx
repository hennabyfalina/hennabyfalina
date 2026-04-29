// src/app/(shop)/contact/page.tsx

import Container from '@/components/ui/Container'
import { Phone, Mail, MapPin, Send, HelpCircle, Package, RefreshCw, Clock, MessageCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Contact Us | ${siteConfig.name}`,
  description: `Get in touch with ${siteConfig.name} for inquiries about orders, bulk purchases, custom packaging, and customer support.`,
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6">
          <Link href="/">Home</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <Link href="/support">Help & Support</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <span className="text-[#C7511F]">Contact Us</span>
        </div>

        <div className="mb-8 border-b border-gray-200 pb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Customer Service</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-3xl">
            We're here to help with your questions and concerns regarding orders, bulk purchases, and custom packaging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="md:col-span-2 space-y-10">
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Help</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="profile/orders" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Package className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Track Order</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Check your order status and tracking details.</p>
                  </div>
                </Link>
                <Link href="/returns-refunds" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <RefreshCw className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Returns & Refunds</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Learn about our 7-day return policy.</p>
                  </div>
                </Link>
                <Link href="/wholesale" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <HelpCircle className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Bulk Orders</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Get wholesale pricing and custom quotes.</p>
                  </div>
                </Link>
                <Link href="/faq" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MessageCircle className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">FAQs</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Find answers to common questions.</p>
                  </div>
                </Link>
              </div>
            </section>

            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-sm text-gray-600 mb-6">
                Whether you have a question about bulk orders, custom prints, or anything else, our team is ready to answer all your questions.
              </p>
              
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-gray-900 mb-1">
                      Your Name <span className="text-red-600">*</span>
                    </label>
                    <input 
                      id="contact-name" 
                      type="text" 
                      placeholder="Enter your full name" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-bold text-gray-900 mb-1">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input 
                      id="contact-email" 
                      type="email" 
                      placeholder="email@example.com" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-bold text-gray-900 mb-1">
                    Phone Number <span className="font-normal text-gray-500">(Optional)</span>
                  </label>
                  <input 
                    id="contact-phone" 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="contact-order" className="block text-sm font-bold text-gray-900 mb-1">
                    Order Number <span className="font-normal text-gray-500">(Optional)</span>
                  </label>
                  <input 
                    id="contact-order" 
                    type="text" 
                    placeholder="e.g., RPC-12345-ABCDE" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-bold text-gray-900 mb-1">
                    Subject <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="contact-subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] text-sm bg-white"
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order Inquiry</option>
                    <option value="bulk">Bulk Order / Wholesale</option>
                    <option value="custom">Custom Packaging</option>
                    <option value="return">Return / Refund</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-gray-900 mb-1">
                    Message <span className="text-red-600">*</span>
                  </label>
                  <textarea 
                    id="contact-message" 
                    rows={5} 
                    placeholder="How can we help you?" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] text-sm resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-gray-900 shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </div>

                <p className="text-xs text-gray-500 pt-2">
                  By submitting this form, you agree to our <Link href="/privacy" className="text-[#007185] hover:underline">Privacy Policy</Link>. 
                  We'll respond to your inquiry within 24 hours.
                </p>
              </form>
            </section>
          </div>

          {/* Action Box (Right) */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0F2F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-[#e77600]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">Call Us</p>
                    <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-gray-600 text-sm hover:text-[#C7511F] transition-colors block">
                      {siteConfig.contact.phone.primary}
                    </a>
                    <a href={`tel:${siteConfig.contact.phone.secondary}`} className="text-gray-600 text-sm hover:text-[#C7511F] transition-colors block mt-1">
                      {siteConfig.contact.phone.secondary}
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0F2F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-[#e77600]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">Email Us</p>
                    <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-gray-600 text-sm hover:text-[#C7511F] transition-colors block">
                      {siteConfig.contact.email.support}
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0F2F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#e77600]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">Visit Us</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {siteConfig.address.line1},<br />
                      {siteConfig.address.line2},<br />
                      {siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.country} – {siteConfig.address.pincode}<br />
                    </p>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${siteConfig.name} ${siteConfig.address.city}`)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#007185] hover:text-[#C7511F] hover:underline mt-2"
                    >
                      Get Directions
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#e77600]" /> Business Hours
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-900">{siteConfig.business.workingHours}</span>
                    <span className="text-xs text-gray-500">Standard business days</span>
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