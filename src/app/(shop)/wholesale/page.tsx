// src/app/(shop)/wholesale/page.tsx

import Container from '@/components/ui/Container'
import { Building2, BadgePercent, Truck, ShieldCheck, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Wholesale & Bulk Orders | ${siteConfig.name}`,
  description: 'Apply for a wholesale account to access bulk pricing, tax benefits, and priority shipping for your business packaging needs.',
}

export default function WholesalePage() {
  const features = [
    { icon: BadgePercent, title: 'Volume Discounts', desc: 'Tiered pricing based on order quantity.' },
    { icon: Building2, title: 'Business Account', desc: 'GST invoicing and tax credit benefits.' },
    { icon: Truck, title: 'Priority Logistics', desc: 'Fast-track shipping for large shipments.' },
    { icon: ShieldCheck, title: 'Quality Assurance', desc: 'Consistent material quality across every batch.' },
  ]

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6">
          <Link href="/">Home</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <Link href="/support">Help & Support</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <span className="text-[#C7511F]">Wholesale & Bulk Orders</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Wholesale Solutions for Your Business</h1>
          <p className="text-sm text-gray-600 mt-2">Powering small businesses to large corporations with premium packaging at factory prices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="flex flex-col p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <f.icon className="w-8 h-8 text-[#007185] mb-3" />
                  <h3 className="font-bold text-gray-900 text-base mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Why Partner With Us?</h2>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                With over decades of experience in the Chennai packaging hub, we understand that reliability is just as important as price. Our wholesale partners receive a dedicated account manager to assist with order forecasting and stock management.
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Custom GSM configurations available upon request.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Warehouse stock reservation for consistent supply.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#e77600] font-bold mt-0.5">•</span>
                  <span>Flexible payment terms for regular, verified clients.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Box (Right) */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-900 text-lg mb-2">Direct WhatsApp Support</h3>
              <p className="text-sm text-gray-600 mb-6">
                Our specialists are available Mon-Sat (9 AM - 7 PM) to provide instant bulk quotes.
              </p>
              
              <div className="space-y-3">
                <Link 
                  href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 text-sm font-bold rounded-sm border border-[#FCD200] shadow-sm transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat for Bulk Pricing
                </Link>
                
                <Link 
                  href="/products"
                  className="block w-full py-2.5 bg-white hover:bg-gray-50 text-gray-900 text-sm font-bold text-center rounded-sm border border-gray-300 shadow-sm transition-colors"
                >
                  Browse Retail Catalog
                </Link>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  For large volume quotes, please have your exact dimensions and quantity requirements ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}