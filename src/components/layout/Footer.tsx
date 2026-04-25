// src/components/layout/Footer.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-black text-gray-300 w-full mt-auto print:hidden">
      {/* Amazon-style Back to Top Banner */}
      <button 
        onClick={scrollToTop} 
        className="w-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-4 transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900"
      >
        Back to top
      </button>

      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 pb-32 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-extrabold text-white mb-4 tracking-tight">
              {siteConfig.name}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {siteConfig.description}
            </p>
          </div>
          
          {/* Quick Links Column */}
          <div className="border-t border-white/10 md:border-none pt-4 md:pt-0 lg:col-start-3">
            <button 
              onClick={() => toggleSection('links')}
              className="flex items-center justify-between w-full md:w-auto text-left mb-2 md:mb-4 group outline-none"
            >
              <h3 className="text-sm font-bold text-white tracking-wide">Quick Links</h3>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 md:hidden ${openSection === 'links' ? 'rotate-180 text-white' : ''}`} />
            </button>
            <ul className={`space-y-3 text-sm text-gray-400 ${openSection === 'links' ? 'block pb-2' : 'hidden md:block'}`}>
              <li>
                <Link href="/products" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
                  Shop Products
                </Link>
              </li>
              <li>
                <Link href="/categories" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link href="/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Column */}
          <div className="border-t border-white/10 md:border-none pt-4 md:pt-0">
            <button 
              onClick={() => toggleSection('contact')}
              className="flex items-center justify-between w-full md:w-auto text-left mb-2 md:mb-4 group outline-none"
            >
              <h3 className="text-sm font-bold text-white tracking-wide">Contact Details</h3>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 md:hidden ${openSection === 'contact' ? 'rotate-180 text-white' : ''}`} />
            </button>
            <ul className={`space-y-3 text-sm text-gray-400 ${openSection === 'contact' ? 'block pb-2' : 'hidden md:block'}`}>
              <li className="flex flex-col gap-1">
                <span className="text-white/60 text-xs uppercase tracking-wider">Email</span>
                <a href={`mailto:${siteConfig.contact.email.orders}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {siteConfig.contact.email.orders}
                </a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-white/60 text-xs uppercase tracking-wider">Phone</span>
                <a href={`tel:${siteConfig.contact.phone.primary}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {siteConfig.contact.phone.primary}
                </a>
                <a href={`tel:${siteConfig.contact.phone.secondary}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {siteConfig.contact.phone.secondary}
                </a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-white/60 text-xs uppercase tracking-wider">Address</span>
                <span className="leading-relaxed">
                  {siteConfig.address.line1},<br />
                  {siteConfig.address.line2},<br />
                  {siteConfig.address.city} - {siteConfig.address.pincode},<br />
                  {siteConfig.address.state}, {siteConfig.address.country}
                </span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-white/60 text-xs uppercase tracking-wider">GSTIN</span>
                <span className="text-white/80">{siteConfig.business.gstin}</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
      
      {/* Bottom Legal Section */}
      <div className="border-t border-white/10 bg-black py-8 pb-32 md:pb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-6">
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
              Conditions of Use & Sale
            </Link>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors outline-none focus:text-yellow-400">
              Privacy Notice
            </Link>
          </div>
          <p className="text-center">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}