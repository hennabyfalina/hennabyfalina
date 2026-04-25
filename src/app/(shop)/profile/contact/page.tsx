// src/app/(shop)/contact/page.tsx

import Container from '@/components/ui/Container'
import { Phone, Mail, MapPin, Send, HelpCircle, Package, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Contact Us | ${siteConfig.name}`
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <span className="text-[#C7511F]">Contact Us</span>
        </div>
        
        <div className="mb-8 border-b border-gray-200 pb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Customer Service</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-3xl">Manage your orders, payments, and account security. Reach out to us if you need further assistance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="md:col-span-2 space-y-10">
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Help</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/orders" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Package className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">A delivery, order or return</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Track package or view status</p>
                  </div>
                </Link>
                <Link href="/profile/payments" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <RefreshCw className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Refunds or Payments</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Track refund or edit payment</p>
                  </div>
                </Link>
                <Link href="/profile/security" className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors sm:col-span-2 md:col-span-1">
                  <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <HelpCircle className="w-5 h-5 text-[#007185]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Account Settings</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Update email, phone or password</p>
                  </div>
                </Link>
              </div>
            </section>

            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-sm text-gray-600 mb-6">Whether you have a question about bulk orders, custom prints, or anything else, our team is ready to answer all your questions.</p>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-gray-900 mb-1">Your Name <span className="text-red-600">*</span></label>
                    <input 
                      id="contact-name" 
                      type="text" 
                      placeholder="Full Name" 
                      className="w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] shadow-sm text-sm" 
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-bold text-gray-900 mb-1">Email Address <span className="text-red-600">*</span></label>
                    <input 
                      id="contact-email" 
                      type="email" 
                      placeholder="email@example.com" 
                      className="w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] shadow-sm text-sm" 
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="contact-order" className="block text-sm font-bold text-gray-900 mb-1">Order Number <span className="font-normal text-gray-500">(Optional)</span></label>
                  <input 
                    id="contact-order" 
                    type="text" 
                    placeholder="e.g. RPC-12345-ABCDE" 
                    className="w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] shadow-sm text-sm" 
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-gray-900 mb-1">Message <span className="text-red-600">*</span></label>
                  <textarea 
                    id="contact-message" 
                    rows={4} 
                    placeholder="How can we help you?" 
                    className="w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] shadow-sm text-sm resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="button" 
                    className="py-2.5 px-6 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-medium text-gray-900 shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Message
                  </button>
                </div>
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
                    <div className="font-bold text-gray-900 text-sm mb-1">Call Us</div>
                    <div className="text-gray-600 text-sm">{siteConfig.contact.phone.primary}</div>
                    <div className="text-gray-600 text-sm mt-1">{siteConfig.contact.phone.secondary}</div>
                    <div className="text-xs text-gray-500 mt-1">Available Mon-Sat, 9AM to 7PM</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0F2F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-[#e77600]" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm mb-1">Email Us</div>
                    <div className="text-gray-600 text-sm">{siteConfig.contact.email.orders}</div>
                    <div className="text-xs text-gray-500 mt-1">We reply within 24 hours</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0F2F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#e77600]" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm mb-1">Head Office</div>
                    <div className="text-gray-600 text-sm leading-relaxed">
                      {siteConfig.address.line1},<br />
                      {siteConfig.address.city} - {siteConfig.address.pincode},<br />
                      {siteConfig.address.state}, {siteConfig.address.country}
                    </div>
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