// src/app/not-found.tsx

import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { ChevronRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[99999] select-none">
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="flex flex-col items-center justify-center gap-10 max-w-2xl w-full">
          
          {/* Graphic Image Column Card */}
          <div className="w-32 h-32 md:w-40 md:h-40 relative flex items-center justify-center bg-stone-50 rounded-[2.5rem] overflow-hidden pointer-events-none">
            <Image 
              src="/cat.jpg" 
              alt="Page not found context placeholder" 
              fill
              priority
              sizes="(max-width: 768px) 160px, 192px"
              className="object-cover"
            />
          </div>
          
          {/* Typography Interaction Links Column */}
          <div className="flex flex-col text-center max-w-md">
            <h1 className="text-gray-900 text-3xl md:text-4xl font-semibold tracking-tight mb-4">Looking for something?</h1>
            <p className="text-gray-500 text-base md:text-lg font-normal mb-10 leading-relaxed px-4">
              The page you’re looking for can’t be found. It might have been moved or no longer exists.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Link Option 1 */}
              <Link 
                href="/" 
                className="px-8 py-3 bg-gray-900 text-white rounded-full text-[15px] font-medium hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Go Home
              </Link>
              
              {/* Link Option 2 */}
              <Link href="/products" className="flex items-center gap-1.5 group text-[15px] font-medium text-blue-600 hover:underline decoration-2 underline-offset-4">
                <span>Browse collection</span>
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}