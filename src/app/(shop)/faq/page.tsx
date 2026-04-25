import Link from 'next/link'
import Container from '@/components/ui/Container'
import { HelpCircle, Package, Truck, RefreshCw, PenTool } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Frequently Asked Questions | ${siteConfig.name}`,
  description: 'Find answers to common questions about orders, shipping, returns, and custom packaging.',
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[900px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6">
          <Link href="/">Home</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <Link href="/support">Help & Support</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <span className="text-[#C7511F]">FAQs</span>
        </div>

        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F0F2F2] flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-[#e77600]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h1>
          <p className="text-sm md:text-base text-gray-600 mt-3 max-w-2xl mx-auto">
            Everything you need to know about our products, shipping, returns, and custom wholesale orders.
          </p>
        </div>

        <div className="space-y-10">
          {/* Category: Ordering */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <Package className="w-5 h-5 text-[#e77600]" />
              Orders & Products
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Do you have a minimum order quantity (MOQ)?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">Yes, our standard packaging items typically have a minimum order quantity ranging from 50 to 100 units depending on the box type. Wholesale orders receive significant volume discounts.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Can I request a sample before placing a large order?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">Absolutely! We encourage you to request samples to check the quality and dimensions. Contact our support team to arrange a sample delivery (shipping charges may apply).</p>
              </div>
            </div>
          </section>

          {/* Category: Customization */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <PenTool className="w-5 h-5 text-[#e77600]" />
              Custom Printing
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Do you print custom logos on boxes?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">Yes, we specialize in custom printing. We can print your brand's logo, colors, and designs on sweet boxes, cake boxes, and carry bags. Custom printing usually requires a higher MOQ (typically 1000+ units).</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">What file formats do you accept for logos?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">For the best print quality, please provide your artwork in high-resolution vector formats such as AI, EPS, SVG, or high-quality PDF/CDR files.</p>
              </div>
            </div>
          </section>

          {/* Category: Shipping */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <Truck className="w-5 h-5 text-[#e77600]" />
              Shipping & Delivery
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">How long does delivery take?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">Standard stock items are dispatched within 1-2 business days and typically arrive within 3-7 days depending on your location in India. Custom printed orders require 10-15 working days for production and delivery.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Do you offer free shipping?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">Yes! We offer free standard shipping on all orders above ₹1,000. For orders below this amount, standard carrier rates apply based on the package weight and destination.</p>
              </div>
            </div>
          </section>

          {/* Category: Returns */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <RefreshCw className="w-5 h-5 text-[#e77600]" />
              Returns & Refunds
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-2">What is your return policy?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">We offer a 7-day replacement guarantee for any defective or damaged products. Please ensure the items are unused and in their original packaging. <Link href="/returns" className="text-[#007185] hover:underline">Read our full return policy here.</Link></p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Contact CTA */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Still have questions?</h2>
          <p className="text-sm text-gray-700 mb-4">We're here to help. Reach out to our customer support team.</p>
          <Link 
            href="/contact" 
            className="inline-flex px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-sm shadow-sm transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </Container>
    </div>
  )
}
