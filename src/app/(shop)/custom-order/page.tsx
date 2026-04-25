// src/app/(shop)/custom-order/page.tsx

import Container from '@/components/ui/Container'
import { Palette, Layers, CheckCircle, FileSearch, ArrowRight, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Custom Packaging & Design | ${siteConfig.name}`,
  description: 'Custom print your logo on boxes, bags, and more. Offset printing solutions for branded packaging.',
}

export default function CustomOrderPage() {
  const steps = [
    { icon: FileSearch, title: 'Requirement', desc: 'Share your dimensions and material needs.' },
    { icon: Palette, title: 'Design', desc: 'Send your logo or work with our designers.' },
    { icon: Layers, title: 'Sample', desc: 'Approve a digital or physical prototype.' },
    { icon: CheckCircle, title: 'Production', desc: 'High-speed offset printing and finishing.' },
  ]

  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6">
          <Link href="/">Home</Link> <span className="text-gray-500 mx-1">›</span>{' '}
          <span className="text-[#C7511F]">Custom Packaging Solutions</span>
        </div>

        <div className="mb-8 border-b border-gray-200 pb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Your Brand, Our Box</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-3xl">
            From luxury rigid boxes to branded sweet boxes, we bring your brand identity to life with precision offset printing. Let your packaging do the talking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="md:col-span-2 space-y-10">
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4 p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-white border border-[#007185] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <step.icon className="w-5 h-5 text-[#007185]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{i + 1}. {step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">What We Can Customize</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Sweet & Snack Boxes',
                  'Luxury Rigid Boxes',
                  'Corrugated Shipping Boxes',
                  'Paper Shopping Bags',
                  'Cake & Pastry Boxes',
                  'Corporate Gift Sets'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-sm">
                    <span className="text-[#e77600] font-bold text-lg leading-none">•</span>
                    <span className="text-sm font-medium text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Action Box (Right) */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-5 bg-blue-50 shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-900 text-lg mb-2">Ready to start?</h3>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                Minimum order quantities apply for custom prints (usually 500+ units depending on the box type). 
              </p>
              
              <div className="space-y-3">
                <Link 
                  href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 text-sm font-bold rounded-sm border border-[#FCD200] shadow-sm transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </Link>
                
                <a 
                  href={`tel:${siteConfig.contact.phone.primary}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-gray-50 text-gray-900 text-sm font-bold rounded-sm border border-gray-300 shadow-sm transition-colors"
                >
                  Call for Quote
                </a>
              </div>
            </div>
          </div>
        </div>

      </Container>
    </div>
  )
}