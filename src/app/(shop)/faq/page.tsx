// src/app/(shop)/faq/page.tsx

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { HelpCircle, Package, Truck, RefreshCw, Sparkles, ChevronRight, Leaf } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Frequently Asked Questions | ${siteConfig.name} Studio`,
  description: 'Find answers to common questions about orders, shipping, returns, and custom henna products.',
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-14 select-none font-sans antialiased text-left pb-24">
      <Container className="max-w-[900px] px-4 sm:px-8">
        
        {/* Breadcrumb Navigation Track - Premium Capitalized Semibold Tones */}
        <div className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1">
          <Link href="/">Home</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">FAQs</span>
        </div>

        {/* Page Header Header Section */}
        <div className="mb-10 pb-8 border-b border-gray-100 text-center flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">Frequently Asked Questions</h1>
          <p className="text-[14px] sm:text-[15px] text-gray-400 font-normal mt-3 max-w-xl leading-relaxed normal">
            Everything you need to verify regarding premium studio products, fulfillment dispatches, returns policy, and wholesale selections.
          </p>
        </div>

        {/* FAQ Content Framework Block */}
        <div className="space-y-12">
          
          {/* Category: Ordering */}
          <section>
            <h2 className="text-[24px] sm:text-[24px] font-normal text-gray-950 tracking-tight flex items-center gap-2.5 mb-6 pb-2 normal tracking-wide">
              <Package className="w-4.5 h-4.5 text-yellow-400" strokeWidth={1.8} />
              Orders & Products
            </h2>
            <div className="flex flex-col w-full -mt-3">
              
              <div className="pb-4 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">Do you carry minimum order quantities (MOQ)?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  Our standard organic henna cones, essential oils, and templates are available for direct checkout with no retail limit rules. Special wholesale quantity options receive custom pricing matrices automatically scaled inside your cart list.
                </p>
              </div>

              <div className="py-0 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">Can I arrange a product sample preview before a large bridal batch purchase?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  Absolutely. We recommend testing individual organic cones beforehand to check consistency and dye properties. You can purchase standard items via checkout, or reach out to support for specialized sample batches.
                </p>
              </div>

            </div>
          </section>

          {/* Category: Customization */}
          <section>
            <h2 className="text-[24px] sm:text-[24px] font-normal text-gray-950 tracking-tight flex items-center gap-2.5 mb-6 pb-2 normal tracking-wide">
              <Leaf className="w-4.5 h-4.5 text-green-400" strokeWidth={1.8} />
              Studio Products & Craft
            </h2>
            <div className="flex flex-col w-full -mt-3">
              
              <div className="pb-4 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">Are your henna selections completely organic?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  Yes, all studio products are meticulously handcrafted using triple-sifted henna leaves and premium organic essential oils. We never integrate harsh chemicals, chemical dyes, or artificial storage preservatives.
                </p>
              </div>

              <div className="py-0 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">How should I store my organic henna cones to ensure stain longevity?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  Because our products contain zero artificial chemical shelf preservatives, fresh paste cones must be stored inside a secure freezer immediately upon arrival and defrosted gently 20 minutes prior to application.
                </p>
              </div>

            </div>
          </section>

          {/* Category: Shipping */}
          <section>
            <h2 className="text-[24px] sm:text-[24px] font-normal text-gray-950 tracking-tight flex items-center gap-2.5 mb-6 pb-2 normal tracking-wide">
              <Truck className="w-4.5 h-4.5 text-blue-400" strokeWidth={1.8} />
              Shipping & Fulfillment
            </h2>
            <div className="flex flex-col w-full -mt-3">
              
              <div className="pb-4 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">What are your standard delivery timelines across India?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  Standard product dispatches are packed and shipped within 1-2 business days. Delivery typical transit durations range between 3-7 operational tracking days depending upon your exact destination hub infrastructure.
                </p>
              </div>

              <div className="py-0 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">Do you offer complimentary free shipping options?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  Yes, complimentary free standard shipping is automatically activated on all batch checkout orders above ₹1,000. Orders below this threshold carry standardized courier parameters calculated during checkout.
                </p>
              </div>

            </div>
          </section>

          {/* Category: Returns */}
          <section>
            <h2 className="text-[24px] sm:text-[24px] font-normal text-gray-950 tracking-tight flex items-center gap-2.5 mb-6 pb-2 normal tracking-wide">
              <RefreshCw className="w-4.5 h-4.5 text-red-400" strokeWidth={1.8} />
              Returns & Refunds Policy
            </h2>
            <div className="flex flex-col w-full -mt-3">
              
              <div className="pb-4 space-y-2 normal">
                <h3 className="font-normal text-gray-950 text-[17px] tracking-tight">What is your product return protocol?</h3>
                <p className="text-[15px] text-gray-400 font-normal leading-relaxed">
                  We guarantee a 7-day repair or replacement log framework for any verified manufacturing defect or damage sustained prior to transit delivery. Items must remain unused in their original packages.{' '}
                  <Link href="/terms-conditions" className="text-gray-950 font-semibold hover:text-gray-500 underline underline-offset-4 transition-colors">
                    Review our full Terms & Conditions here.
                  </Link>
                </p>
              </div>

            </div>
          </section>
        </div>

        {/* 🚀 FIXED: Rebuilt loud yellow/blue CTA cards into an Apple-style floating clean section text block */}
        <div className="mt-16 pt-10 border-t border-gray-100 text-center space-y-4">
          <h2 className="text-[27px] font-bnormalold text-gray-950 tracking-tight capitalize">Still Have Outstanding Questions?</h2>
          <p className="text-[14px] text-gray-400 font-normal max-w-sm mx-auto leading-relaxed normal">
            Our support desk is ready to assist your session. Reach out anytime for real-time clarification.
          </p>
          <div className="pt-2">
            <Link 
              href="/contact-support" 
              className="inline-flex h-11 px-8 bg-black hover:bg-stone-900 text-white rounded-full text-[14px] font-semibold transition-colors items-center justify-center capitalize shadow-none outline-none active:scale-[0.99]"
            >
              Contact Support Desk
            </Link>
          </div>
        </div>

      </Container>
    </div>
  )
}