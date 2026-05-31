// src/app/(shop)/terms/page.tsx

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Terms & Conditions | ${siteConfig.name}`,
  description: `Read the terms and conditions for using ${siteConfig.name} services.`,
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#F0F2F2] border-b border-gray-200">
        <Container className="py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-sm text-gray-600 mt-2">Last updated: May 2026</p>
        </Container>
      </div>

      <Container className="py-8 md:py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Agreement */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              By accessing or using {siteConfig.name}&apos;s website and services, you agree to be bound by these Terms & Conditions. 
              If you do not agree, please do not use our services.
            </p>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Products and Pricing</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>All product descriptions, images, and specifications are for reference only and may vary slightly</li>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to modify or discontinue any product at any time</li>
              <li>Bulk pricing is available for qualifying orders - contact us for details</li>
              <li>GST and other applicable taxes are included in the displayed price</li>
            </ul>
          </section>

          {/* Orders */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Orders and Payment</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Order confirmation does not guarantee acceptance of your order</li>
              <li>We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspected fraud</li>
              <li>Payment is processed securely through Razorpay</li>
              <li>Orders are processed within 1-2 business days</li>
              <li>You will receive order confirmation and shipping updates via email/SMS</li>
            </ul>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Shipping and Delivery</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Shipping costs are calculated at checkout based on order value and location</li>
              <li>FREE delivery on orders above ₹1000</li>
              <li>Standard delivery: 3-7 business days (varies by location)</li>
              <li>Store pickup available at our Chennai location - FREE</li>
              <li>Tracking information will be shared once your order ships</li>
              <li>Delivery times are estimates and not guaranteed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Order Cancellations & Modifications</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li><strong className="font-semibold">Pre-Production Modifications:</strong> Customization modifications can be accommodated only if requested <em>before</em> the production cycle begins.</li>
              <li><strong className="font-semibold">Post-Production Policy:</strong> Once production has commenced, orders cannot be cancelled, modified, or refunded under any circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Returns, Replacements & Defect Liability</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li><strong className="font-semibold">Strictly No Cash Refunds:</strong> As a B2B packaging manufacturer, we do not offer cash or bank refunds for customized or standard bulk orders.</li>
              <li><strong className="font-semibold">Defect Resolution:</strong> In the rare event of a manufacturing defect originating from our facility, we will <strong>repair or replace</strong> the affected products at no additional cost.</li>
              <li>To initiate a replacement claim, you must notify us within 7 days of delivery with detailed photographic evidence of the defect.</li>
              <li>Products must remain unused and in their original packaging to qualify for a replacement inspection.</li>
              <li>Claims for damages caused during third-party transit or improper handling post-delivery will not be entertained.</li>
            </ul>
          </section>

          {/* Account Responsibility */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Account Responsibility</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. 
              Notify us immediately of any unauthorized account use. We are not liable for losses 
              resulting from unauthorized access to your account.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Prohibited Activities</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Attempting to manipulate prices or order system</li>
              <li>Using automated bots or scripts to place orders</li>
              <li>Reselling products without authorization</li>
              <li>Posting false or misleading information</li>
              <li>Attempting to bypass security measures</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {siteConfig.name} shall not be liable for indirect, incidental, or consequential damages 
              arising from the use of our products or services. Our total liability shall not exceed the amount 
              paid for the product in question.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Intellectual Property</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              All content on this website, including images, logos, text, and product designs,
              is the property of {siteConfig.name} and protected by copyright laws. 
              Unauthorized use is prohibited.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Dispute Resolution</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Any disputes arising from these Terms shall be governed by the laws of India and resolved 
              in the courts of Chennai, Tamil Nadu.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We reserve the right to update these Terms at any time. Continued use of our services 
              after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Information</h2>
            <p className="text-sm text-gray-700 mb-3">
              For questions about these Terms, contact us:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong className="font-semibold">Email:</strong> <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.email.orders}</a></p>
              <p><strong className="font-semibold">Phone:</strong>{' '}
                <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.phone.primary}</a>,{' '}
                <a href={`tel:${siteConfig.contact.phone.secondary}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.phone.secondary}</a>
              </p>
              <p><strong className="font-semibold">Address:</strong> {siteConfig.address.line1}, {siteConfig.address.line2}, {siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}</p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}