// src/app/(shop)/services/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import Container from '@/components/ui/Container'
import { createClient } from '@/lib/supabase/server'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import { ChevronRight, Clock, Users, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Studio Services | ${siteConfig.name} Studio`,
  description: 'Review our curated premium services tiers, ranging from traditional signature bridal sessions to scalable group celebration sangeet batches.',
}

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch live active service rows ordered by display rank parameters
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const liveServices = services || []

  return (
    <div className="min-h-screen bg-white py-8 md:py-16 font-sans antialiased select-none text-left pb-24">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Breadcrumb Navigation - Left-Aligned Minimalist Strings */}
        <div className="text-[15px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1 w-fit">
          <Link href="/">Home</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Our Services</span>
        </div>
        
        {/* Left-Aligned Premium Section Header */}
        <div className="mb-14 pb-8">
          <h1 className="text-3xl md:text-5xl font-normal text-gray-900 tracking-tight capitalize">
            Studio Services
          </h1>
          <p className="text-[14px] sm:text-[14px] text-gray-400 font-normal mt-2 max-w-xl leading-relaxed capitalize">
            Experience premium, productized artisan service tiers. We combine centuries-old henna art traditions with clean modern execution to create lasting memories for your special milestones.
          </p>
        </div>

        {/* Core Services Stack Layout Track */}
        <div className="space-y-20">
          {liveServices.map((service, index) => {
            
            // Resolve bucket asset URLs cleanly
            let imageUrl = '/placeholder-service.jpg'
            if (service.image) {
              imageUrl = service.image.startsWith('http') || service.image.startsWith('/')
                ? service.image
                : getPublicUrl(service.image)
            }

            // Generate structured WhatsApp inquiry parameter deep links dynamically
            const phone = siteConfig.contact.phone.primary.replace(/\D/g, '')
            const whatsappText = `*New Studio Booking Reservation Request*\n\n` +
              `*Service Tier:* ${service.name}\n` +
              `*Baseline Cost:* ${formatCurrency(service.starting_price)}\n\n` +
              `Hello Studio! I am reviewing your premium Services directory and would love to check availability parameters to secure a session booking slot.`
            
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`

            return (
              <div 
                key={service.id} 
                className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-between border-b border-stone-100 pb-16 last:border-0 last:pb-0 w-full group"
              >
                
                {/* Left Area: High-Contrast Cover Visual Asset */}
                <div className="w-full md:w-[380px] aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] relative bg-stone-50 border border-stone-100 rounded-3xl overflow-hidden shrink-0">
                  <Image
                    src={imageUrl}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    priority={index === 0}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/[0.01] group-hover:bg-black/[0.03] transition-colors" />
                </div>

                {/* Right Area: Informational Context Alignment Track */}
                <div className="flex-1 space-y-5 text-left w-full pt-1">
                  <div className="space-y-1">
                    <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest block">
                      {service.tagline || 'Premium Studio Package'}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-normal text-gray-950 tracking-tight capitalize">
                      {service.name.toLowerCase()}
                    </h2>
                  </div>

                  <p className="text-[14px] sm:text-[15px] text-gray-400 font-medium leading-relaxed capitalize max-w-xl">
                    {service.description}
                  </p>

                  {/* Apple-Style Un-boxed Specification Matrix */}
                  <div className="grid grid-cols-3 gap-4 border-y border-stone-100 py-4 max-w-md">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                      </div>
                      <p className="text-[13px] font-semibold text-gray-950 capitalize">{service.duration}</p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3.5 h-3.5" strokeWidth={1.8} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Capacity</span>
                      </div>
                      <p className="text-[13px] font-semibold text-gray-950 capitalize">{service.capacity}</p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-400">
                        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.8} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Investment</span>
                      </div>
                      <p className="text-[13px] font-bold text-gray-950 capitalize">From {formatCurrency(service.starting_price)}</p>
                    </div>
                  </div>

                  {/* 🚀 ZERO-FRICTION AUTOMATED ACTION CONVERSION PILL */}
                  <div className="pt-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 px-8 bg-black hover:bg-stone-900 text-white rounded-full text-[13px] font-semibold transition-colors items-center justify-center capitalize shadow-none outline-none active:scale-[0.99] gap-1.5 group/btn"
                    >
                      <span>Request booking slot</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/80 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" strokeWidth={2.5} />
                    </a>
                  </div>

                </div>

              </div>
            )
          })}
        </div>

      </Container>
    </div>
  )
}