import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[9999]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 md:gap-16 max-w-4xl w-full">
          {/* Graphic Side */}
          <div className="w-48 h-48 md:w-64 md:h-64 relative flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm shadow-sm overflow-hidden pointer-events-none select-none">
            <Image 
              src="/cat.jpg" 
              alt="Page not found" 
              fill
              priority
              sizes="(max-width: 768px) 192px, 256px"
              className="object-cover"
            />
          </div>
          
          {/* Text Side (Amazon Match) */}
          <div className="flex flex-col text-center md:text-left max-w-md mt-2">
            <h1 className="text-[#e77600] text-2xl md:text-3xl font-bold mb-3">Looking for something?</h1>
            <p className="text-gray-900 text-sm md:text-base font-medium mb-6">
              We&apos;re sorry. The Web address you entered is not a functioning page on our site.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[#e77600] text-[10px]">▶</span>
                <p className="text-gray-900 font-bold text-sm md:text-base">
                  Go to {siteConfig.name}&apos;s <Link href="/" className="text-[#007185] hover:text-[#C7511F] hover:underline">Home Page</Link>
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[#e77600] text-[10px]">▶</span>
                <p className="text-gray-900 font-bold text-sm md:text-base">
                  Browse our <Link href="/products" className="text-[#007185] hover:text-[#C7511F] hover:underline">Product Catalog</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}