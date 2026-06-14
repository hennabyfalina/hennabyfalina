// src/app/not-found.tsx

import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { ChevronRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[99999] select-none">
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 max-w-2xl w-full">
          
          {/* Graphic Image Column Card */}
          <div className="w-40 h-40 md:w-48 md:h-48 relative flex items-center justify-center bg-stone-50 border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden pointer-events-none">
            <Image 
              src="/cat.jpg" 
              alt="Page not found context placeholder" 
              fill
              priority
              sizes="(max-width: 768px) 160px, 192px"
              className="object-cover grayscale blur-[0.2px] hover:grayscale-0 transition-all duration-700"
            />
          </div>
          
          {/* Typography Interaction Links Column */}
          <div className="flex flex-col text-center md:text-left max-w-sm">
            {/* 🚀 FIXED: Scrubbed out loud orange colors, utilizing pure monochrome elements */}
            <h1 className="text-gray-900 text-xl md:text-2xl font-black tracking-wide mb-2 capitalize">Looking For Something?</h1>
            <p className="text-gray-400 text-[13px] font-medium mb-6 leading-relaxed capitalize">
              The web location address path requested does not match an operational route link inside our studio.
            </p>
            
            <div className="space-y-3 flex flex-col items-center md:items-start">
              {/* Link Option 1 */}
              <Link href="/" className="flex items-center gap-2 group text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors capitalize">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-900 transition-colors" strokeWidth={2.5} />
                <span>Go to {siteConfig.name} home</span>
              </Link>
              
              {/* Link Option 2 */}
              <Link href="/products" className="flex items-center gap-2 group text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors capitalize">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-900 transition-colors" strokeWidth={2.5} />
                <span>Browse full collection</span>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}