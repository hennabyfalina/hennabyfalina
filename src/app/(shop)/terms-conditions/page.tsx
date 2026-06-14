// src/app/(shop)/terms-conditions/page.tsx

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Terms & Conditions | ${siteConfig.name} Studio`,
  description: `Read the terms and conditions for using ${siteConfig.name} services.`,
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white select-none font-sans antialiased text-left pb-24">
      
      {/* 🚀 FIXED: Transformed background header block into an elegant, floating typography layer */}
      <div className="bg-white border-b border-gray-100">
        <Container className="max-w-4xl px-4 sm:px-8 py-8 md:py-14 flex flex-col md:flex-row items-center justify-center gap-x-4 text-center">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">
            Terms & Conditions
          </h1>
          <p className="text-[15px] md:text-[17px] text-gray-400 font-normal md:mt-2 capitalize">
            (Last updated: June 2026)
          </p>
        </Container>
      </div>

      <Container className="py-10 md:py-16 max-w-4xl px-4 sm:px-8">
        <div className="space-y-10">
          
          {/* Agreement */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">1. Agreement to Terms</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              By accessing or using {siteConfig.name}&apos;s website and premium studio services, you agree to be bound by these Terms & Conditions. 
              If you do not agree with any specified parameters, please discontinue your use of our services immediately.
            </p>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">2. Products and Pricing</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>All product descriptions, catalog images, and specifications are for reference only and may vary slightly.</li>
              <li>Prices are subject to change without prior notice or operational adjustments.</li>
              <li>We reserve the right to modify or discontinue any product selection at any time.</li>
              <li>Bulk pricing is available for qualifying batch orders - contact our studio for details.</li>
              <li>GST and other applicable statutory taxes are included in the final displayed price.</li>
            </ul>
          </section>

          {/* Orders */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">3. Orders and Payment</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>Order confirmation does not guarantee formal acceptance of your request funnel.</li>
              <li>We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspected authentication fraud.</li>
              <li>Payment parameters are processed securely through the integrated Razorpay network gateway.</li>
              <li>Standard orders are processed within 1-2 business days.</li>
              <li>You will receive order confirmation and real-time shipping tracking updates via official WhatsApp notification templates.</li>
            </ul>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">4. Shipping and Delivery</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>Shipping costs are calculated at checkout based on batch order values and final hub location.</li>
              <li>FREE delivery is provided on orders above ₹1000.</li>
              <li>Standard delivery: 3-7 business days depending on localized transit logistics channels.</li>
              <li>Complimentary store pickup is available at our home studio point location - FREE.</li>
              <li>Tracking info parameters will be shared once your shipment has been dispatched.</li>
              <li>Delivery timelines are estimates provided by third-party logistics and are not absolute guarantees.</li>
            </ul>
          </section>

          {/* Cancellations */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">5. Order Cancellations & Modifications</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li><strong className="font-bold text-gray-950">Pre-Production Modifications:</strong> Customization modifications can be accommodated only if requested <em className="italic">before</em> the production cycle begins.</li>
              <li><strong className="font-bold text-gray-950">Post-Production Policy:</strong> Once production has commenced, orders cannot be cancelled, modified, or refunded under any circumstances.</li>
            </ul>
          </section>

          {/* Return Liabilities */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">6. Returns, Replacements & Defect Liability</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li><strong className="font-bold text-gray-950">Strictly No Cash Refunds:</strong> As a premium custom manufacturer, we do not offer cash or bank refunds for customized or standard bulk orders.</li>
              <li><strong className="font-bold text-gray-950">Defect Resolution:</strong> In the rare event of a manufacturing defect originating from our facility, we will <strong className="font-semibold text-gray-950">repair or replace</strong> the affected products at no additional cost.</li>
              <li>To initiate a replacement claim, you must notify us within 7 days of delivery with detailed photographic evidence of the defect.</li>
              <li>Products must remain unused and in their original packaging to qualify for a replacement inspection.</li>
              <li>Claims for damages caused during third-party transit or improper handling post-delivery will not be entertained.</li>
            </ul>
          </section>

          {/* Account Responsibility */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">7. Account Responsibility</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              You are responsible for maintaining the confidentiality of your account credentials. 
              Notify us immediately of any unauthorized account use. We are not liable for losses 
              resulting from unauthorized access to your account workspace.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">8. Prohibited Activities</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>Attempting to manipulate product pricing parameters or the ordering framework system.</li>
              <li>Using automated scraping bots, scripts, or scraping nodes to place requests.</li>
              <li>Reselling studio products without explicit brand authorization.</li>
              <li>Posting false, misleading, or deceptive feedback information logs.</li>
              <li>Attempting to bypass built-in verification security measures.</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">9. Limitation of Liability</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              {siteConfig.name} shall not be liable for indirect, incidental, or consequential damages 
              arising from the use of our products or application services. Our total liability parameters shall not exceed the amount 
              paid for the specific product in question.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">10. Intellectual Property</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              All content on this website, including images, brand logos, text, and custom product designs,
              is the explicit property of {siteConfig.name} and protected by copyright laws. 
              Unauthorized duplication or distribution is prohibited.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">11. Dispute Resolution</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              Any disputes arising from these Terms shall be governed by the laws of India and resolved 
              exclusively in the competent courts of Chennai, Tamil Nadu.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">12. Changes to Terms</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              We reserve the right to update these Terms at any time. Continued use of our services 
              after changes have been published constitutes full acceptance of the revised Terms.
            </p>
          </section>

          {/* 🚀 FIXED: Converted old Amazon grey card layout into an elegant hairline list */}
          <section className="pt-10 border-t border-gray-100">
            <h2 className="text-[27px] sm:text-[27px] font-normal text-gray-950 tracking-tight mb-4 capitalize">Contact Information</h2>
            <p className="text-[16px] text-gray-400 font-normal mb-5 normal">
              For questions regarding these Terms or account parameters, contact us directly:
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
          </section>

        </div>
      </Container>
    </div>
  )
}