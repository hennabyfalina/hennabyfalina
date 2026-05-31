// src/app/(shop)/privacy/page.tsx

import Link from 'next/link'
import Container from '@/components/ui/Container'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Learn how ${siteConfig.name} collects, uses, and protects your personal information.`,
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/privacy`,
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#F0F2F2] border-b border-gray-200">
        <Container className="py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mt-2">Last updated: May 2026</p>
        </Container>
      </div>

      <Container className="py-8 md:py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Introduction</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              At {siteConfig.name}, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you visit our website 
              or make a purchase from us.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Information We Collect</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li><strong className="font-semibold">Personal Information:</strong> Name, email address, phone number, shipping address, billing address</li>
              <li><strong className="font-semibold">Payment Information:</strong> Payment details processed securely through Razorpay (we do not store card details)</li>
              <li><strong className="font-semibold">Order Information:</strong> Products purchased, order history, delivery preferences</li>
              <li><strong className="font-semibold">Technical Data:</strong> IP address, browser type, device information, cookies</li>
              <li><strong className="font-semibold">Usage Data:</strong> How you interact with our website</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Process and fulfill your orders</li>
              <li>Communicate about order status, shipping updates, and delivery</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our products, services, and website experience</li>
              <li>Send promotional offers (with your consent)</li>
              <li>Prevent fraud and enhance security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Sharing Your Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Sharing Your Information</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li><strong className="font-semibold">Service Providers:</strong> Shipping carriers, payment processors (Razorpay), and IT services</li>
              <li><strong className="font-semibold">Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong className="font-semibold">Business Transfers:</strong> In the event of merger or acquisition</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Security</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We implement industry-standard security measures including SSL encryption, secure servers, 
              and regular security audits to protect your data. Payment information is processed securely 
              through Razorpay, and we never store your full payment details on our servers.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Rights</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-sm text-gray-700 mt-3">
              To exercise these rights, contact us at <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.email.orders}</a>
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We use cookies to enhance your browsing experience, remember your preferences, 
              and analyze site traffic. You can control cookie settings through your browser preferences.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Children&apos;s Privacy</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our website is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may update this privacy policy periodically. We will notify you of any material changes 
              by posting the new policy on this page with an updated effective date.
            </p>
          </section>

          {/* Contact Us */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-sm text-gray-700 mb-3">
              If you have questions about this privacy policy or how we handle your data:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong className="font-semibold">Email:</strong> <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.email.orders}</a></p>
              <p><strong className="font-semibold">Phone:</strong>{' '}
                <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.phone.primary}</a>,{' '}
                <a href={`tel:${siteConfig.contact.phone.secondary}`} className="text-[#007185] hover:text-[#C7511F]">{siteConfig.contact.phone.secondary}</a>
              </p>
              <p><strong className="font-semibold">Address:</strong> {siteConfig.address.line1}, {siteConfig.address.line2}, {siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}</p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  )
}