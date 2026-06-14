// src/components/layout/Footer.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ArrowUp } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function Footer() {
  const pathname = usePathname()
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  
  useEffect(() => {
    // Detect if running as an installed App (PWA Standalone mode)
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    setIsStandalone(isAppStandalone)
  }, [])

  // Smart Routing: Skip footer layout injection on terminal checkout steps or admin channels
  const hiddenRoutes = ['/checkout', '/admin-gate', '/admin']
  const shouldHideFooter = hiddenRoutes.some(route => pathname.startsWith(route))
  
  if (shouldHideFooter || isStandalone) {
    return null
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-white border-t border-gray-100 text-gray-500 w-full mt-auto print:hidden pwa-hide font-sans antialiased" suppressHydrationWarning>
      
      {/* 🚀 FIXED: Weightless Back to Top Row Button Link Tracker */}
      <button 
        onClick={scrollToTop} 
        className="w-full bg-stone-50/60 hover:bg-stone-50 text-gray-400 hover:text-gray-900 text-[15px] font-normal py-4 transition-colors outline-none border-b border-gray-100 flex items-center justify-center gap-1.5 cursor-pointer group"
      >
        <span className="normal">Back to top</span>
        <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
      </button>

      {/* 🚀 FIXED: Google Studio-Method Content Grid Directory Maps */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 pb-32 md:pb-16" suppressHydrationWarning>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12" suppressHydrationWarning>
          
          {/* Brand Signature Column Node Descriptor */}
          <div className="md:col-span-2 lg:col-span-2 space-y-4" suppressHydrationWarning>
            <h3 className="text-[18px] font-medium text-gray-950 capitalize">
              {siteConfig.name.toLowerCase()}
            </h3>
            <p className="text-[15px] text-gray-500 font-normal leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>
          </div>
          
          {/* Column 2: Flagship Products Directory (Enriched for CRO visibility loops) */}
          <div className="border-t border-gray-100 md:border-none pt-4 md:pt-0" suppressHydrationWarning>
            <button 
              onClick={() => toggleSection('products')}
              className="flex items-center justify-between w-full md:w-auto text-left mb-2 md:mb-4 group outline-none"
            >
              <h3 className="text-[15px] font-medium text-gray-950 capitalize">Our products</h3>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 md:hidden ${openSection === 'products' ? 'rotate-180 text-gray-950' : ''}`} />
            </button>
            <ul className={`space-y-3 text-[15px] font-normal text-gray-500 ${openSection === 'products' ? 'block pb-2' : 'hidden md:block'}`}>
              <li><Link href="/products?category=bridal-henna-cone" className="hover:text-blue-600 transition-colors outline-none">Bridal henna cones</Link></li>
              <li><Link href="/products?category=henna-dip-box-5pc" className="hover:text-blue-600 transition-colors outline-none">Organic henna dips</Link></li>
              <li><Link href="/products?category=bridal-oil" className="hover:text-blue-600 transition-colors outline-none">Artisanal essential oils</Link></li>
              <li><Link href="/products?category=aftercare-oil" className="hover:text-blue-600 transition-colors outline-none">Stain aftercare fixes</Link></li>
              <li><Link href="/wholesale" className="hover:text-blue-600 transition-colors outline-none">Bulk wholesale tiers</Link></li>
            </ul>
          </div>

          {/* Column 3: Corporate Directory Information Links */}
          <div className="border-t border-gray-100 md:border-none pt-4 md:pt-0" suppressHydrationWarning>
            <button 
              onClick={() => toggleSection('links')}
              className="flex items-center justify-between w-full md:w-auto text-left mb-2 md:mb-4 group outline-none"
            >
              <h3 className="text-[15px] font-medium text-gray-950 capitalize">Studio matrix</h3>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 md:hidden ${openSection === 'links' ? 'rotate-180 text-gray-950' : ''}`} />
            </button>
            <ul className={`space-y-3 text-[15px] font-normal text-gray-500 ${openSection === 'links' ? 'block pb-2' : 'hidden md:block'}`}>
              <li><Link href="/products" className="hover:text-blue-600 transition-colors outline-none">Shop collections</Link></li>
              <li><Link href="/services" className="hover:text-blue-600 transition-colors outline-none">Bespoke studio services</Link></li>
              <li><Link href="/collections" className="hover:text-blue-600 transition-colors outline-none">Design portfolios</Link></li>
              <li><Link href="/contact-support" className="hover:text-blue-600 transition-colors outline-none">Contact our team</Link></li>
              <li><Link href="/faq" className="hover:text-blue-600 transition-colors outline-none">Faq &amp; storage rules</Link></li>
            </ul>
          </div>
          
          {/* Column 4: Studio Contact Context Strings */}
          <div className="border-t border-gray-100 md:border-none pt-4 md:pt-0" suppressHydrationWarning>
            <button 
              onClick={() => toggleSection('contact')}
              className="flex items-center justify-between w-full md:w-auto text-left mb-2 md:mb-4 group outline-none"
            >
              <h3 className="text-[15px] font-medium text-gray-950 capitalize">Contact links</h3>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 md:hidden ${openSection === 'contact' ? 'rotate-180 text-gray-950' : ''}`} />
            </button>
            <ul className={`space-y-4 text-[15px] font-normal text-gray-500 ${openSection === 'contact' ? 'block pb-2' : 'hidden md:block'}`}>
              <li className="flex flex-col gap-0.5">
                <span className="text-gray-400 text-[12px] lowercase">email</span>
                <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-gray-500 hover:text-blue-600 transition-colors font-normal">
                  {siteConfig.contact.email.orders}
                </a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="text-gray-400 text-[12px] lowercase">phone &amp; whatsapp</span>
                <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-gray-500 hover:text-blue-600 transition-colors font-normal">
                  {siteConfig.contact.phone.primary}
                </a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="text-gray-400 text-[12px] lowercase">studio base</span>
                <span className="leading-relaxed text-gray-500">
                  {siteConfig.address.city.toLowerCase()}, {siteConfig.address.state.toLowerCase()}
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>
      
      {/* ========================================================================= */}
      {/* BOTTOM LEGAL STRIP BLOCK (SLIGHTLY SUBTLE STONE GRID OVERLAY)             */}
      {/* ========================================================================= */}
      <div className="border-t border-gray-100 bg-stone-50/60 py-6 pb-32 md:pb-6" suppressHydrationWarning>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 text-[13px] font-normal text-gray-400" suppressHydrationWarning>
          <div className="flex items-center gap-6" suppressHydrationWarning>
            <Link href="/terms" className="hover:text-gray-900 transition-colors outline-none lowercase">
              conditions of use
            </Link>
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors outline-none lowercase">
              privacy notice
            </Link>
            <Link href="/returns-refunds" className="hover:text-gray-900 transition-colors outline-none lowercase">
              returns &amp; refunds
            </Link>
          </div>
          <p className="text-center tracking-normal font-normal">
            &copy; {new Date().getFullYear()} {siteConfig.name.toLowerCase()}. all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}