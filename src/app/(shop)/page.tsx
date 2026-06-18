// src/app/(shop)/page.tsx

import { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CategorySection from '@/components/home/CategorySection'
import DesignCollectionsSection from '@/components/home/DesignCollectionsSection'
import ServicesSection from '@/components/home/ServicesSection'
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection'
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import ContactSection from '@/components/home/ContactSection'
import { createClient } from '@/lib/supabase/server'
import RecentlyBoughtCarousel from '@/components/product/RecentlyBoughtCarousel'

// 🏛️ Centralized Service Action Import
import { getCategoriesWithCounts } from '@/services/category.service'

// ⚡ HIGH-PERFORMANCE STATIC ENGINE: Cache this layout block at the serverless edge CDN container.
export const revalidate = 3600 // Revalidate layout once per hour

export const metadata: Metadata = {
  title: 'Henna By Falina | Premium Organic Henna Cones & Essentials',
  description: 'Discover premium, 100% chemical-free organic henna cones, pure essential oils, triple-sifted powder, and custom bridal artist kits.',
  alternates: {
    canonical: 'https://hennabyfalina.com',
  },
}

export default async function HomePage() {
  const supabase = await createClient()

  // 🚀 OPTIMIZED PARALLEL ORCHESTRATION
  // We substitute raw database select joins with our secure, cached service action helper
  const [categoriesData, collectionsRes, featuredRes] = await Promise.all([
    getCategoriesWithCounts(),
    supabase.from('collections').select('*').order('display_order'),
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(8)
  ])

  const databaseCollections = collectionsRes.data
  const featuredProducts = featuredRes.data

  // Filter out non-shop items to maintain your homepage carousel layout rules cleanly
  const shopCategories = categoriesData.filter(c => c.type === 'shop' || !c.type)

  return (
    <div className="flex-1 flex flex-col w-full bg-white pb-16 select-none font-sans antialiased text-gray-900" suppressHydrationWarning>
      <div className="w-full max-w-[1600px] mx-auto relative">
        
        {/* Block 1: Premium Immersive Hero Area */}
        <HeroSection />
        
        {/* Main Content Layout Block */}
        <div className="px-4 sm:px-8 relative z-10 -mt-8 sm:-mt-16 space-y-4 sm:space-y-8 max-w-[1400px] mx-auto w-full">
          
          {/* Block 2: Visual Mini-Navigation Bubbles */}
          <CategorySection categories={shopCategories} />
          
          {/* Block 3: Returning Shopper Personalization Shelf */}
          <div className="min-h-0">
            <RecentlyBoughtCarousel />
          </div>
          
          {/* Block 4: Featured Products Shelf */}
          <FeaturedProductsSection 
            products={featuredProducts || []} 
            title="Featured collection" 
          />
          
          {/* Block 2.5: Curated Design Portfolios Horizontal Swiper Strip */}
          <DesignCollectionsSection collections={databaseCollections || []} />

          {/* Block 2.6: Bespoke Studio Services Section */}
          <ServicesSection />

          {/* Block 5: Core Value Pillars & Trust Framework */}
          <WhyChooseUsSection />
          
          {/* Block 6: Social Proof & Testimonials */}
          <TestimonialsSection />
          
          {/* Block 7: Clean Connect Footer Area */}
          <ContactSection />
          
        </div>
      </div>
    </div>
  )
}