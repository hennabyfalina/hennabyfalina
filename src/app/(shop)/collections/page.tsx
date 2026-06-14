// src/app/(shop)/collections/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import Container from '@/components/ui/Container'
import { createClient } from '@/lib/supabase/server'
import { getPublicUrl } from '@/lib/supabase/storage'
import { ChevronRight, ArrowUpRight } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Design Collections | ${siteConfig.name} Studio`,
  description: 'Explore our curated lookbooks of handcrafted organic henna artwork, ranging from traditional bridal heritages to minimal contemporary signatures.',
}

export default async function CollectionsPage() {
  const supabase = await createClient()

  // Fetch collections records explicitly sorted by display_order rank parameters
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true })

  const curatedCollections = collections || []

  return (
    <div className="min-h-screen bg-white py-8 md:py-16 font-sans antialiased select-none text-left pb-24">
      <Container className="max-w-[1200px] px-4 sm:px-8">
        
        {/* Breadcrumb Navigation Track */}
        <div className="text-[15px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1 w-fit">
          <Link href="/">Home</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Design Collections</span>
        </div>
        
        {/* Centered Premium Section Header */}
        <div className="mb-12 pb-8 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-normal text-gray-900 tracking-tight capitalize">
            Design Collections
          </h1>
          <p className="text-[15px] sm:text-[15px] text-gray-400 font-normal mt-2 max-w-2xl leading-relaxed normal mx-auto">
            Immerse your session in our lookbooks of handcrafted artwork. Each signature tier is meticulously formulated to elevate traditional bridal milestones and contemporary celebrations.
          </p>
        </div>

        {/* Empty State Fallback Handling */}
        {curatedCollections.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-medium text-[15px] capitalize">
            No design collections are published at this moment. Check back soon.
          </div>
        ) : (
          /* 🚀 EDITORIAL LOOKBOOK GRID MATRIX */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {curatedCollections.map((portfolio, index) => {
              
              // 📦 FIXED: Resolves image paths dynamically out of the 'shop-assets' storage bucket folders safely
              let imageUrl = '/placeholder-collection.jpg'
              if (portfolio.image) {
                imageUrl = portfolio.image.startsWith('http') || portfolio.image.startsWith('/')
                  ? portfolio.image
                  : getPublicUrl(portfolio.image)
              }

              return (
                <Link 
                  key={portfolio.id}
                  href={`/collections/${portfolio.slug || portfolio.id}`}
                  className="group flex flex-col w-full text-left outline-none"
                >
                  {/* Premium Bounding Image Frame - Full Bleed Parity with Category Cards */}
                  <div className="w-full aspect-[4/5] relative bg-stone-50 border border-stone-100 rounded-3xl overflow-hidden mb-4 transition-all duration-500 ease-out group-hover:border-gray-950 group-hover:shadow-xs">
                    <Image
                      src={imageUrl}
                      alt={portfolio.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={index < 3}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    
                    {/* Weightless Dark Overlay Tint Layer */}
                    <div className="absolute inset-0 bg-black/[0.02] group-hover:bg-black/[0.05] transition-colors duration-500" />
                  </div>

                  {/* Left-Aligned Descriptive Typography Matrix */}
                  <div className="px-1 flex items-start justify-between gap-4 w-full">
                    <div className="space-y-0.5">
                      <h3 className="text-[17px] sm:text-[18px] font-semibold text-gray-950 tracking-tight group-hover:text-stone-600 transition-colors capitalize">
                        {portfolio.name.toLowerCase()}
                      </h3>
                      <p className="text-[13px] sm:text-[14px] text-gray-400 font-medium capitalize">
                        {portfolio.description || 'Explore master gallery lookbook'}
                      </p>
                    </div>

                    {/* Premium Minimal Action Indicator Glyph */}
                    <div className="w-8 h-8 rounded-full bg-stone-50 group-hover:bg-black text-gray-400 group-hover:text-white border border-stone-100 group-hover:border-black flex items-center justify-center shrink-0 transition-all duration-300">
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
                    </div>
                  </div>

                </Link>
              )
            })}
          </div>
        )}

      </Container>
    </div>
  )
}