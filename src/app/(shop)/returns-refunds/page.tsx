import Link from 'next/link'
import Container from '@/components/ui/Container'
import { RefreshCw, PackageCheck, AlertTriangle, Clock, CreditCard, ChevronRight } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Returns & Refunds | ${siteConfig.name}`,
  description: 'Learn about our 7-day replacement guarantee and refund policies.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6">
          <Link href="/">Home</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <Link href="/support">Help & Support</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <span className="text-[#C7511F]">Returns & Refunds</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Replacement & Liability Policy</h1>
          <p className="text-sm text-gray-600 mt-2">Professional B2B guidelines on manufacturing defects, replacements, and customizations.</p>
        </div>

        {/* Highlight Card */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#C7511F]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Strictly No Cash Refunds</h2>
            <p className="text-sm text-gray-700">
              As an industrial packaging supplier, we operate on a strictly <strong>Repair or Replace</strong> basis. We do not offer cash or bank refunds for confirmed orders under any circumstances.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#e77600]" />
              Manufacturing Defects & Replacements
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>If a product is delivered with a verified manufacturing defect on our end, we will <strong>repair or replace</strong> the affected units free of charge.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Claims must be filed with high-resolution photographic evidence within <strong>7 days</strong> of delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Products must remain unused and in their original packaging to qualify for a replacement inspection.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#e77600]" />
              Custom Orders & Modifications
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Can I change my artwork or customization?</h3>
                <p className="text-sm text-gray-600">
                  Modifications to artwork, sizes, or quantities can be accommodated <strong>only if requested before the production cycle begins.</strong> Once the plates are made or printing commences, the order is locked.
                </p>
              </div>
              <div className="p-5 bg-gray-50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Post-Production Policy</h3>
                  <p className="text-sm text-gray-600">
                    Once production has started, custom printed boxes and personalized packaging materials are <strong>strictly non-cancellable and non-returnable.</strong> You are fully responsible for the final output based on the approved artwork.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to action */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Need to return an item?</h2>
            <p className="text-sm text-gray-700 mb-4 max-w-md mx-auto">
              Our support team is ready to help you with your return request. Have your order number ready.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-gray-900 shadow-sm transition-colors"
            >
              Contact Support to Initiate Return
            </Link>
          </section>
        </div>

      </Container>
    </div>
  )
}
