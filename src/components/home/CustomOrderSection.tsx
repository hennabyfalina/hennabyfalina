// src/components/home/CustomOrderSection.tsx

'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function CustomOrderSection() {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex flex-col h-full" suppressHydrationWarning>
      <div className="flex items-center gap-3 mb-3" suppressHydrationWarning>
        <Settings className="w-6 h-6 text-[#e77600]" />
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Custom Printing</h2>
      </div>
      <p className="text-md text-gray-600 mb-4 flex-1">
        Upload your brand logo and artwork directly on the product page. Choose from Standard, Premium, or UV printing options with instant pricing.
      </p>
      <ul className="text-md text-gray-700 space-y-2 mb-6">
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Instant Online Pricing</li>
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Direct File Uploads & Notes</li>
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> 3 Professional Print Tiers</li>
      </ul>
      <Link
        href="/products"
        className="w-full py-2 bg-[#FFD814] text-gray-900 text-sm font-bold text-center border border-[#FCD200] rounded-sm hover:bg-[#F7CA00] shadow-sm"
      >
        Browse Custom Products
      </Link>
    </div>
  )
}