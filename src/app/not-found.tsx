import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Clean Header */}
      <header className="w-full py-4 flex items-center justify-center border-b border-gray-100">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 hover:opacity-90 transition-opacity">
          {siteConfig.name}
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-16 md:pt-24 pb-20 px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 md:gap-16 max-w-4xl w-full">
          {/* Graphic Side */}
          <Link href="/">
            <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm hover:bg-gray-100 transition-colors shadow-sm">
              <PackageSearch className="w-24 h-24 md:w-32 md:h-32 text-gray-300" strokeWidth={1} />
            </div>
          </Link>
          
          {/* Text Side (Amazon Match) */}
          <div className="flex flex-col text-center md:text-left max-w-md mt-2">
            <h1 className="text-[#e77600] text-2xl md:text-3xl font-bold mb-3">Looking for something?</h1>
            <p className="text-gray-900 text-sm md:text-base font-medium mb-6">
              We're sorry. The Web address you entered is not a functioning page on our site.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[#e77600] text-[10px]">▶</span>
              <p className="text-gray-900 font-bold text-sm md:text-base">
                Go to {siteConfig.name}'s <Link href="/" className="text-[#007185] hover:text-[#C7511F] hover:underline">Home Page</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-gray-50 py-8 border-t border-gray-200 mt-auto">
        <div className="flex justify-center items-center gap-6 mb-4 flex-wrap px-4">
          <Link href="/terms" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Conditions of Use</Link>
          <Link href="/privacy" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Privacy Notice</Link>
          <Link href="/help" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Help</Link>
        </div>
        <p className="text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}