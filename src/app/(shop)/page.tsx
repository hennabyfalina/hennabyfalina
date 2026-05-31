// src/app/(shop)/page.tsx

import { Metadata } from 'next'
import { getFeaturedProductsWithSignedUrls } from '@/services/product.service'
import HeroSection from '@/components/home/HeroSection'
import CategorySection from '@/components/home/CategorySection'
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection'
import CustomOrderSection from '@/components/home/CustomOrderSection'
import WholesaleSection from '@/components/home/WholesaleSection'
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import ContactSection from '@/components/home/ContactSection'
import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Razack Packaging Centre | Wholesale Packaging Solutions',
  description: 'Premium wholesale packaging, readymade boxes, and custom printing solutions.',
  alternates: {
    canonical: 'https://www.razackpackagingcentre.com',
  },
}

const RecentlyBoughtCarousel = dynamic(() => import('@/components/product/RecentlyBoughtCarousel'), {
  loading: () => <div className="w-full h-[340px] bg-white border border-gray-100 animate-pulse rounded-sm shadow-sm" />
})

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  const { data: categories } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      image,
      products (id)
    `)
    .order('display_order', { ascending: true })

  const categoriesWithCount = categories?.map(category => ({
    ...category,
    product_count: category.products?.length || 0,
  })) || []

  const featuredProducts = await getFeaturedProductsWithSignedUrls(8)

  return (
    <div className="flex-1 flex flex-col w-full bg-[#eaeded] pb-8" suppressHydrationWarning>
      {/* Hero spans full width on mobile, max-width on desktop */}
      <div className="w-full max-w-[1500px] mx-auto relative" suppressHydrationWarning>
        <HeroSection />
        
        {/* Main Content Container with negative margin to pull up over hero gradient */}
        <div className="px-2 sm:px-4 relative z-10 -mt-12 sm:-mt-32 space-y-4 sm:space-y-6" suppressHydrationWarning>
          <CategorySection categories={categoriesWithCount} />
          
          {/* Recently Bought Carousel */}
          {userId && <RecentlyBoughtCarousel userId={userId} />}
          
          <FeaturedProductsSection products={featuredProducts} title="Featured Products" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" suppressHydrationWarning>
            <WholesaleSection />
            <CustomOrderSection />
          </div>
          
          <WhyChooseUsSection />
          <TestimonialsSection />
          <ContactSection />
        </div>
      </div>
    </div>
  )
}