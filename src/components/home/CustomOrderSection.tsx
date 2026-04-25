// src/components/home/CustomOrderSection.tsx

'use client'

import Link from 'next/link'
import { Package, Settings } from 'lucide-react'

export default function CustomOrderSection() {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <Settings className="w-6 h-6 text-[#e77600]" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Custom Orders</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4 flex-1">
        Need specific dimensions or your brand logo printed on boxes? Tell us your requirements and we will manufacture it for you.
      </p>
      <ul className="text-sm text-gray-700 space-y-2 mb-6">
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Custom Dimensions</li>
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Logo Printing</li>
        <li className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Choice of materials</li>
      </ul>
      <Link
        href="/contact"
        className="w-full py-2 bg-[#FFD814] text-gray-900 text-sm font-bold text-center border border-[#FCD200] rounded-sm hover:bg-[#F7CA00] shadow-sm"
      >
        Request a Quote
      </Link>
    </div>
  )
}