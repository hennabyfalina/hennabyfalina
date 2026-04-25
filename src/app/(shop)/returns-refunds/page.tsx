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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Returns & Refunds Policy</h1>
          <p className="text-sm text-gray-600 mt-2">Everything you need to know about returning items and getting your money back.</p>
        </div>

        {/* Highlight Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">7-Day Replacement Guarantee</h2>
            <p className="text-sm text-gray-700">
              We offer a 7-day replacement guarantee for any defective, damaged, or incorrect items delivered to you. 
              Simply initiate a return within 7 days of delivery.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Eligibility Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#e77600]" />
              Eligibility for Returns
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Items must be completely unused and in their original condition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Original packaging, tags, and invoice must be intact and included.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Custom printed boxes and personalized packaging materials are <strong>strictly non-returnable</strong> unless there is a manufacturing defect.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Return requests must be raised within 7 days of the delivery date.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#e77600]" />
              Refund Process & Timelines
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-gray-900 text-sm mb-2">When will I get my refund?</h3>
                <p className="text-sm text-gray-600">
                  Once we receive your returned item, our quality team will inspect it. If approved, the refund will be initiated immediately. 
                  It typically takes <strong>5-7 business days</strong> for the amount to reflect in your original payment method.
                </p>
              </div>
              <div className="p-5 bg-gray-50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Return Shipping Costs</h3>
                  <p className="text-sm text-gray-600">
                    If the return is due to a defect or error on our end, we will cover the return shipping costs. For all other returns, the buyer is responsible for the return shipping fees.
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
