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
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Henna by falina | Premium Organic Henna Cones & Essentials',
  description: 'Discover premium, 100% chemical-free organic henna cones, pure essential oils, triple-sifted powder, and custom bridal artist kits.',
  alternates: {
    canonical: 'https://www.hennabyfalina.com',
  },
}

const RecentlyBoughtCarousel = dynamic(() => import('@/components/product/RecentlyBoughtCarousel'), {
  loading: () => <div className="w-full h-[340px] bg-white border border-gray-50 animate-pulse rounded-2xl" />
})

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  const { data: allCategories } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      image,
      type,
      products (id)
    `)
    .order('display_order', { ascending: true })

  const shopCategories = allCategories?.filter(c => c.type === 'shop') || []

  const { data: databaseCollections } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true })

  const categoriesWithCount = shopCategories.map(category => ({
    ...category,
    product_count: category.products?.length || 0,
  }))

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="flex-1 flex flex-col w-full bg-white pb-16 select-none font-sans antialiased text-gray-900" suppressHydrationWarning>
      <div className="w-full max-w-[1600px] mx-auto relative">
        
        {/* Block 1: Premium Immersive Hero Area */}
        <HeroSection />
        
        {/* Main Content Layout Block (Clean, un-boxed spacing standard) */}
        <div className="px-4 sm:px-8 relative z-10 -mt-8 sm:-mt-16 space-y-12 sm:space-y-20 max-w-[1400px] mx-auto w-full">
          
          {/* Block 2: Visual Mini-Navigation Bubbles */}
          <CategorySection categories={categoriesWithCount} />
          
          {/* Block 3: Returning Shopper Personalization Shelf */}
          {userId && <RecentlyBoughtCarousel userId={userId} />}
          
          {/* Block 4: Featured Products Shelf */}
          <FeaturedProductsSection 
            products={featuredProducts || []} 
            title="Featured collection" 
          />
          
          {/* 🌟 NEW Block 2.5: Curated Design Portfolios Horizontal Swiper Strip */}
          <DesignCollectionsSection collections={databaseCollections || []} />

          {/* 🌟 NEW Block 2.6: Bespoke Studio Services Section */}
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