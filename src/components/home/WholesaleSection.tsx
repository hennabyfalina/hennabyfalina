// src/components/home/WholesaleSection.tsx

'use client'

import Link from 'next/link'
import { Package, TrendingUp } from 'lucide-react'

export default function WholesaleSection() {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex flex-col h-full" suppressHydrationWarning>
      <div className="flex items-center gap-3 mb-3" suppressHydrationWarning>
        <TrendingUp className="w-6 h-6 text-[#007185]" />
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Wholesale Pricing</h2>
      </div>
      <p className="text-md text-gray-600 mb-4 flex-1">
        Get the best rates for bulk orders. We offer competitive wholesale pricing for businesses, retailers, and high-volume buyers.
      </p>
      <ul className="text-md text-gray-700 space-y-2 mb-6">
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Free samples available</li>
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Custom branding options</li>
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Pan-India delivery</li>
      </ul>
      <Link
        href="/contact"
        className="w-full py-2 bg-white text-gray-900 text-sm font-bold text-center border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm"
      >
        Contact Sales
      </Link>
    </div>
  )
}