// src/app/(shop)/collections/[slug]/page.tsx

'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getPublicUrl } from '@/lib/supabase/storage'
import Container from '@/components/ui/Container'
import { ChevronRight } from 'lucide-react'
import LookbookOverlay from '@/components/collections/LookbookOverlay'

interface CollectionPageProps {
  params: Promise<{ slug: string }>
}

interface DesignItem {
  id: string
  name: string
  image: string
  description?: string
  estimated_time?: string
  complexity?: string
  price_range?: string
}

export default function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = use(params)
  const supabase = createClient()
  
  const [collection, setCollection] = useState<any>(null)
  const [designs, setDesigns] = useState<DesignItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDesign, setSelectedDesign] = useState<DesignItem | null>(null)

  useEffect(() => {
    async function fetchCollectionData() {
      try {
        // 1. Fetch core parent collection via slug
        const { data: collectionData } = await supabase
          .from('collections')
          .select('*')
          .eq('slug', slug)
          .single()

        if (collectionData) {
          setCollection(collectionData)

          // 2. Fetch all child design items belonging to this collection
          const { data: designsData } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('collection_id', collectionData.id)
            .order('display_order', { ascending: true })

          setDesigns(designsData || [])
        }
      } catch (err) {
        console.error('Error compiling lookbook items:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollectionData()
  }, [slug])

  if (loading) return null // Handled smoothly via companion loading.tsx fallback

  if (!collection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <p className="text-gray-400 font-medium text-[15px] capitalize">Lookbook collection profile not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8 md:py-16 font-sans antialiased select-none text-left pb-24 relative">
      <Container className="max-w-[1200px] px-4 sm:px-8">
        
        {/* Left-Aligned Breadcrumb Navigation */}
        <div className="text-[15px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1 w-fit">
          <Link href="/">Home</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <Link href="/collections">Collections</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900 truncate max-w-[180px] sm:max-w-none capitalize">
            {collection.name.toLowerCase()}
          </span>
        </div>
        
        {/* Left-Aligned Header Summary */}
        <div className="mb-12 border-b border-stone-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">
            {collection.name.toLowerCase()}
          </h1>
          {collection.description && (
            <p className="text-[15px] sm:text-[16px] text-gray-400 font-medium mt-2 max-w-2xl leading-relaxed capitalize">
              {collection.description}
            </p>
          )}
        </div>

        {/* Clean Masonry Lookbook Photo Array */}
        {designs.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-medium text-[14px] capitalize">
            Individual masterpieces are currently being processed for this catalog tier.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {designs.map((design) => {
              
              // 📦 Resolves dynamic public storage URLs directly out of your 'shop-assets' bucket folder maps safely
              const itemImageUrl = design.image.startsWith('http') || design.image.startsWith('/')
                ? design.image
                : getPublicUrl(design.image)
              
              // Standardize image properties so that child overlays map correctly
              const designPayloadWithUrl = {
                ...design,
                image: itemImageUrl
              }

              return (
                <div 
                  key={design.id}
                  onClick={() => setSelectedDesign(designPayloadWithUrl)}
                  className="group flex flex-col w-full text-left cursor-pointer outline-none"
                >
                  <div className="w-full aspect-[3/4] relative bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden mb-3 transition-all duration-300 group-hover:border-gray-950">
                    <Image
                      src={itemImageUrl}
                      alt={design.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                  
                  <div className="px-0.5">
                    <h3 className="text-[14px] sm:text-[15px] font-semibold text-gray-950 truncate capitalize group-hover:text-stone-600 transition-colors">
                      {design.name.toLowerCase()}
                    </h3>
                    {design.price_range && (
                      <p className="text-[12px] text-gray-400 font-semibold mt-0.5">
                        {design.price_range}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 🚀 IMMERSIVE CONTROL SHEET INTERACTION ENGINE LINK */}
        <LookbookOverlay 
          design={selectedDesign} 
          collectionName={collection.name} 
          onClose={() => setSelectedDesign(null)} 
        />

      </Container>
    </div>
  )
}