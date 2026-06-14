// src/app/(shop)/about/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import Container from '@/components/ui/Container'
import { getPublicUrl } from '@/lib/supabase/storage'
import { ChevronRight, ArrowUpRight, Sparkles, ShieldCheck, Clock } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Our Story | ${siteConfig.name} Studio`,
  description: 'Learn about our dedication to handcrafted organic henna artistry, uncompromising cosmetic safety protocols, and professional milestone execution standards.',
}

export default function AboutPage() {
  // Resolve editorial story covers directly out of your public shop-assets folders
  const craftImageUrl = getPublicUrl('services/covers/editorial-bespoke.jpg')

  return (
    <div className="min-h-screen bg-white py-8 md:py-16 font-sans antialiased select-none text-left pb-24">
      <Container className="max-w-[900px] px-4 sm:px-8">
        
        {/* Left-Aligned Breadcrumb Navigation */}
        <div className="text-[15px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1 w-fit">
          <Link href="/">Home</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Our Story</span>
        </div>
        
        {/* Left-Aligned Section Header */}
        <div className="mb-14 pb-8">
          <h1 className="text-3xl md:text-5xl font-normal text-gray-900 tracking-tight capitalize">
            Our Story & Philosophy
          </h1>
          <p className="text-[15px] sm:text-[16px] text-gray-400 font-normal mt-2 max-w-xl leading-relaxed capitalize">
            A relentless dedication to pure organic composition, absolute symmetrical discipline, and professional elegance for your most significant life celebrations.
          </p>
        </div>

        {/* Core Narrative Split Blocks */}
        <div className="space-y-16">
          
          {/* Pillar 1: The Artisan Narrative (The Craft) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-gray-400">
              <Sparkles className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
              <span className="text-[11px] font-bold uppercase tracking-widest">1. The Craft Definition</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-y-4 gap-x-8 items-start">
              <h2 className="text-xl sm:text-2xl font-normal text-gray-950 md:col-span-2 tracking-tight capitalize leading-tight">
                Honoring traditional roots through fine line precision.
              </h2>
              <p className="text-[14px] sm:text-[15px] text-gray-400 font-normal leading-relaxed md:col-span-3 normal">
                At {siteConfig.name} Studio, we view henna not as a casual transient accent, but as a prestigious living heritage art form. Every symmetrical mandala loop, historical pattern cuff, and custom geometric layout tracing is executed with fine line hand-eye coordination. We obsess over structural fluidity to guarantee your custom pattern adapts flawlessly to your natural posture.
              </p>
            </div>
          </section>

          {/* Large Format Borderless Section Showpiece Artwork Photo */}
          <div className="w-full aspect-[16/9] relative bg-stone-50 border border-stone-100 rounded-3xl overflow-hidden my-8">
            <Image
              src={craftImageUrl}
              alt="Artisan Craft Detailing"
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Pillar 2: The Organic Safety Shield (The Product Purity) */}
          <section className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2.5 text-gray-400">
              <ShieldCheck className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
              <span className="text-[11px] font-bold uppercase tracking-widest">2. The Safety Shield</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-y-4 gap-x-8 items-start">
              <h2 className="text-xl sm:text-2xl font-normal text-gray-950 md:col-span-2 tracking-tight capitalize leading-tight">
                An ironclad commitment to zero chemical adjustments.
              </h2>
              <div className="text-[14px] sm:text-[15px] text-gray-400 font-normal leading-relaxed md:col-span-3 space-y-4 normal">
                <p>
                  The modern market is saturated with toxic, mass-produced chemical dyes that jeopardize skin safety for artificial speed. We reject this compromise entirely. 
                </p>
                <p>
                  Every single cone utilized inside our private studio sessions or shipped through our storefront directory is mixed by hand from raw organic elements. We source premium, triple-sifted Sojat leaves from Rajasthan, infusing them exclusively with pure therapeutic essential oils like Tea Tree and Eucalyptus. Zero chemicals. Zero preservatives. Just a pure, deep dark mahogany stain progression that safeguards your health.
                </p>
              </div>
            </div>
          </section>

          {/* Pillar 3: The Experience Manifesto (The Professionalism) */}
          <section className="space-y-4 pt-10 border-t border-stone-100">
            <div className="flex items-center gap-2.5 text-gray-400">
              <Clock className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
              <span className="text-[11px] font-bold uppercase tracking-widest">3. The Experience Manifesto</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-y-4 gap-x-8 items-start">
              <h2 className="text-xl sm:text-2xl font-normal text-gray-950 md:col-span-2 tracking-tight capitalize leading-tight">
                Disciplined professionalism on your milestone mornings.
              </h2>
              <p className="text-[14px] sm:text-[15px] text-gray-400 font-normal leading-relaxed md:col-span-3 normal">
                Bridal celebrations require precision scheduling. We understand that punctuality and structural composure are just as critical as artistic execution. Our studio artists maintain absolute focus, arrive precisely on time, and project a calm, reassuring presence that removes session anxiety. We handle your milestone parameters with the executive professionalism your family deserves.
              </p>
            </div>
          </section>

        </div>

        {/* 🚀 APPLE-STYLE FLOATING REDIRECT FOOTER BUTTON CARD */}
        <div className="mt-20 pt-12 border-t border-stone-100 text-center space-y-5">
          <h2 className="text-3xl font-normal text-gray-990 tracking-tight capitalize">Experience The Studio Standard</h2>
          <p className="text-[14px] text-gray-400 font-normal max-w-sm mx-auto leading-relaxed normal">
            Whether securing a private bridal session or ordering premium retail cones, your profile is backed by our purity lock.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link 
              href="/services" 
              className="inline-flex h-11 px-8 bg-black hover:bg-stone-900 text-white rounded-full text-[14px] font-semibold transition-colors items-center justify-center capitalize cursor-pointer shadow-none group"
            >
              <span>Explore Studio Services</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/80 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
            </Link>
            <Link 
              href="/collections" 
              className="inline-flex h-11 px-8 bg-stone-50 border border-transparent hover:border-stone-200 text-gray-900 rounded-full text-[14px] font-semibold transition-colors items-center justify-center capitalize cursor-pointer shadow-none"
            >
              Browse Gallery Lookbooks
            </Link>
          </div>
        </div>

      </Container>
    </div>
  )
}