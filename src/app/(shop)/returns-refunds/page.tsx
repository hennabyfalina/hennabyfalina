// src/app/(shop)/returns-refunds/page.tsx

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { ChevronRight } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Returns & Refunds | ${siteConfig.name} Studio`,
  description: 'Learn about our 7-day replacement guarantee and refund policies.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white select-none font-sans antialiased text-left pb-24">
      
      {/* 🚀 FIXED: Transformed background header block into your exact matching, elegant floating typography layer */}
      <div className="bg-white border-b border-gray-100">
        <Container className="max-w-4xl px-4 sm:px-8 py-8 md:py-14 flex flex-col md:flex-row items-center justify-center gap-x-4 text-center">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">
            Returns & Refunds
          </h1>
          <p className="text-[15px] md:text-[17px] text-gray-400 font-normal md:mt-2 capitalize">
            (Last updated: June 2026)
          </p>
        </Container>
      </div>

      <Container className="py-10 md:py-16 max-w-4xl px-4 sm:px-8">

        <div className="space-y-10">
          
          {/* Refund Policy Declaration */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">1. Strictly No Cash Refunds</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              As a premium handcrafted studio and custom manufacturer, we operate on a strictly <strong className="font-bold text-gray-950">Repair or Replace</strong> framework basis. We do not offer direct cash or bank refunds for confirmed checkout orders under any circumstances.
            </p>
          </section>

          {/* Defects and Replacements */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">2. Manufacturing Defects & Replacements</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>If a product is delivered with a verified manufacturing defect originating from our facility, we will <strong className="font-bold text-gray-950">repair or replace</strong> the affected units free of any additional charge.</li>
              <li>Defect claims must be filed with high-resolution photographic validation evidence within <strong className="font-bold text-gray-950">7 days</strong> of delivery.</li>
              <li>Products must remain completely unused and in their original packaging blocks to qualify for a formal replacement inspection.</li>
              <li>Claims for structural damages caused during third-party transit routes or improper post-delivery handling will not be accommodated.</li>
            </ul>
          </section>

          {/* Modifications Policy */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">3. Custom Orders & Modifications</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>Modifications to product options, sizes, or custom quantities can be accommodated <strong className="font-bold text-gray-950">only if requested explicitly before the production cycle begins.</strong></li>
              <li>Once product paste formulas are prepared, templates cut, or manufacturing lines commence, the order parameters are locked.</li>
              <li>Once production has actively started, custom personalized materials are <strong className="font-bold text-gray-950">strictly non-cancellable and non-returnable.</strong> You maintain full responsibility for the final output configuration.</li>
            </ul>
          </section>

          {/* Account Responsibilities */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">4. Shipping & Return Dispatches</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              Approved replacement dispatches will be prioritized and shipped out via standard logistics lines. Customers are responsible for verifying address accuracy in their account workspace prior to fulfillment cycles.
            </p>
          </section>

          {/* 🚀 FIXED: Rebuilt loud yellow/blue cards into your exact matching Apple-style hairline contact listing block */}
          <section className="pt-10 border-t border-gray-100">
            <h2 className="text-[27px] sm:text-[27px] font-normal text-gray-950 tracking-tight mb-4 capitalize">Contact Information</h2>
            <p className="text-[16px] text-gray-400 font-normal mb-5 normal">
              To initiate a defect replacement claim or verify order parameters, connect with our support desk:
            </p>
            
            <div className="space-y-3.5 text-[15px] text-gray-600 font-medium capitalize">
              <p>
                <span className="text-gray-400 font-semibold mr-2">Email:</span> 
                <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-gray-950 font-normal hover:text-gray-500 transition-colors normal-case">
                  {siteConfig.contact.email.orders}
                </a>
              </p>
              <p>
                <span className="text-gray-400 font-semibold mr-2">Phone:</span>{' '}
                <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-gray-950 font-normal hover:text-gray-500 transition-colors tracking-wide">
                  {siteConfig.contact.phone.primary}
                </a>
                <span className="text-gray-200 mx-2">|</span>
                <a href={`tel:${siteConfig.contact.phone.secondary}`} className="text-gray-950 font-normal hover:text-gray-500 transition-colors tracking-wide">
                  {siteConfig.contact.phone.secondary}
                </a>
              </p>
              <p className="leading-relaxed">
                <span className="text-gray-400 font-semibold mr-2 block sm:inline sm:mb-0 mb-1">Address:</span> 
                <span className="text-gray-900 font-normal">
                  {siteConfig.address.line1}, {siteConfig.address.line2}, {siteConfig.address.city} – {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}
                </span>
              </p>
            </div>
            
            <div className="pt-8 text-center sm:text-left">
              <Link 
                href="/contact-support" 
                className="inline-flex h-11 px-8 bg-black hover:bg-stone-900 text-white rounded-full text-[14px] font-semibold transition-colors items-center justify-center capitalize shadow-none outline-none active:scale-[0.99]"
              >
                Connect With Support Desk
              </Link>
            </div>
          </section>

        </div>
      </Container>
    </div>
  )
}