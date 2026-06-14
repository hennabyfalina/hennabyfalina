// src/app/(shop)/privacy-policy/page.tsx

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Privacy Policy | ${siteConfig.name} Studio`,
  description: `Learn how ${siteConfig.name} collects, uses, and protects your personal information.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/privacy-policy`,
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white select-none font-sans antialiased text-left pb-24">
      
      {/* 🚀 FIXED: Rebuilt background header block into your elegant, floating typography layer */}
      <div className="bg-white border-b border-gray-100">
        <Container className="max-w-4xl px-4 sm:px-8 py-8 md:py-14 flex flex-col md:flex-row items-center justify-center gap-x-4 text-center">
          <h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight capitalize">
            Privacy Policy
          </h1>
          <p className="text-[15px] md:text-[17px] text-gray-400 font-normal md:mt-2 capitalize">
            (Last updated: June 2026)
          </p>
        </Container>
      </div>

      <Container className="py-10 md:py-16 max-w-4xl px-4 sm:px-8">
        <div className="space-y-10">
          
          {/* Introduction */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">1. Introduction</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              At {siteConfig.name}, we respect your profile privacy and are explicitly committed to protecting your personal data streams. 
              This policy parameters explain how we collect, use, and safeguard your credentials when you interact with our website workspace 
              or make an organic purchase from our studio selection.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">2. Information We Collect</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-4 capitalize">
              We may process and record the following specific parameter categories:
            </p>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li><strong className="font-bold text-gray-950">Personal Identity Details:</strong> Full name, verified email link, phone contact, delivery address, and billing metrics.</li>
              <li><strong className="font-bold text-gray-950">Secure Payment Logs:</strong> Transaction details processed safely through the integrated Razorpay framework. We do not store card credentials on our servers.</li>
              <li><strong className="font-bold text-gray-950">Fulfillment Records:</strong> Products purchased, checkout history configurations, and specific delivery instructions note parameters.</li>
              <li><strong className="font-bold text-gray-950">Technical Footprint Data:</strong> IP address tracking, hardware device profiles, browser configurations, and encrypted cookie identifiers.</li>
              <li><strong className="font-bold text-gray-950">Interaction Metrics:</strong> Detailed analytical data tracing how your session navigates our studio storefront.</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>Process transactions and fulfill active batch orders smoothly.</li>
              <li>Communicate dispatch tracking, order statuses, and delivery confirmations via automated WhatsApp templates.</li>
              <li>Provide custom studio customer support and respond to incoming help desk inquiries.</li>
              <li>Optimize our handcrafted product line offerings and global frontend website speed configurations.</li>
              <li>Prevent transaction fraud, secure session authentication logs, and enhance system firewalls.</li>
              <li>Maintain strict compliance boundaries with Indian corporate and taxation legal obligations.</li>
            </ul>
          </section>

          {/* Sharing Information */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">4. Sharing Your Information</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-4 capitalize">
              We maintain an ironclad standard: we never sell your personal information. Data parameters are only coordinated with:
            </p>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li><strong className="font-bold text-gray-950">Authorized Service Partners:</strong> Verified shipping carriers, our Razorpay processing network, and internal technical database infrastructure nodes.</li>
              <li><strong className="font-bold text-gray-950">Statutory Legal Demands:</strong> When required explicitly by corporate legislation or to defend our framework rights.</li>
              <li><strong className="font-bold text-gray-950">Business Ownership Changes:</strong> In the transition event of an enterprise merger, asset transfer, or corporate restructuring loop.</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">5. Data Security Parameters</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              We implement industry-standard encryption protocols including dynamic SSL handshakes, secure servers, 
              and strict middleware access gates to wrap your profile data. Payment matrices are processed in an insulated 
              environment by Razorpay, and full card details are completely withheld from our servers.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">6. Your Session Rights</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-4 capitalize">
              Under current guidelines, your profile retains the rights to:
            </p>
            <ul className="list-disc pl-5 space-y-2.5 text-[14px] text-gray-500 font-medium capitalize">
              <li>Access stored personal information parameters.</li>
              <li>Correct inaccurate data records or update outdated communication lines.</li>
              <li>Request full deletion of your registered data index profiles.</li>
              <li>Opt-out of optional automated marketing or notification rules.</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">7. Cookies and Tracking</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              We use localized session cookies to optimize route navigation speeds, remember active shopping cart inventories, 
              and evaluate system usage metrics. You can completely configure or restrict cookie storage rules inside your personal browser properties.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">8. Children&apos;s Privacy Boundaries</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              Our e-commerce checkout is not configured for children under 13. We do not intentionally harvest or process data indices from visitors under the age of 13.
            </p>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-[16px] sm:text-[17px] font-bold text-gray-950 tracking-tight mb-3 capitalize">9. Changes to Privacy Policy</h2>
            <p className="text-[14px] text-gray-500 font-medium leading-relaxed capitalize">
              We reserve the right to refine this policy timeline context periodically. We will signal any material updates 
              by publishing the revised framework parameters on this interface page with a modified effective timeline timestamp.
            </p>
          </section>

          {/* 🚀 FIXED: Converted old Amazon grey card layout into your elegant borderless hairline list layout */}
          <section className="pt-10 border-t border-gray-100">
            <h2 className="text-[27px] sm:text-[27px] font-normal text-gray-950 tracking-tight mb-4 capitalize">Contact Information</h2>
            <p className="text-[16px] text-gray-400 font-normal mb-5 normal">
              For questions regarding this Privacy Policy or data registry logs, contact us directly:
            </p>
            
            <div className="space-y-3.5 text-[15px] text-gray-600 font-medium capitalize">
              <p>
                <span className="text-gray-400 font-semibold mr-2">Email:</span> 
                <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-gray-950 font-normal hover:text-gray-500 transition-colors normal-case">
                  {siteConfig.contact.email.orders}
                </a>
              </p>
              <p>
                <span className="text-gray-400 font-semibold mr-2">Phone:</span>{' '}
                <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-gray-950 font-normal hover:text-gray-500 transition-colors tracking-wide">
                  {siteConfig.contact.phone.primary}
                </a>
                <span className="text-gray-200 mx-2">|</span>
                <a href={`tel:${siteConfig.contact.phone.secondary}`} className="text-gray-950 font-normal hover:text-gray-500 transition-colors tracking-wide">
                  {siteConfig.contact.phone.secondary}
                </a>
              </p>
              <p className="leading-relaxed">
                <span className="text-gray-400 font-semibold mr-2 block sm:inline sm:mb-0 mb-1">Address:</span> 
                <span className="text-gray-900 font-normal">
                  {siteConfig.address.line1}, {siteConfig.address.line2}, {siteConfig.address.city} – {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}
                </span>
              </p>
            </div>
          </section>

        </div>
      </Container>
    </div>
  )
}