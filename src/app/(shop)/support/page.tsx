// src/app/(shop)/support/page.tsx

import Container from '@/components/ui/Container'
import { 
  HelpCircle, 
  Package, 
  CreditCard, 
  Truck, 
  RefreshCw, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Phone, 
  MessageCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  UserCheck,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Help & Support | ${siteConfig.name}`,
  description: 'Get help with orders, returns, payments, and more. Find answers to frequently asked questions or contact our support team.',
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <Container className="max-w-[1200px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/">Home</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Help & Support</span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F0F2F2] rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-[#e77600]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">How can we help you?</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl mx-auto">
            Find answers to common questions or contact our support team for personalized assistance
          </p>
        </div>

        {/* Quick Help Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Link href="/profile/orders" className="group bg-white p-5 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F0F2F2] flex items-center justify-center group-hover:bg-[#e77600]/10 transition-colors">
              <Package className="w-6 h-6 text-[#e77600]" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Orders & Tracking</h3>
            <p className="text-xs text-gray-500 mt-1">Track orders, delivery status</p>
          </Link>

          <Link href="/returns-refunds" className="group bg-white p-5 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F0F2F2] flex items-center justify-center group-hover:bg-[#e77600]/10 transition-colors">
              <RefreshCw className="w-6 h-6 text-[#e77600]" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Returns & Refunds</h3>
            <p className="text-xs text-gray-500 mt-1">7-day replacement policy</p>
          </Link>

          <Link href="/profile/payments" className="group bg-white p-5 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F0F2F2] flex items-center justify-center group-hover:bg-[#e77600]/10 transition-colors">
              <CreditCard className="w-6 h-6 text-[#e77600]" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Payments & Billing</h3>
            <p className="text-xs text-gray-500 mt-1">Secure payment methods</p>
          </Link>

          <Link href="/support/shipping" className="group bg-white p-5 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F0F2F2] flex items-center justify-center group-hover:bg-[#e77600]/10 transition-colors">
              <Truck className="w-6 h-6 text-[#e77600]" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Shipping Info</h3>
            <p className="text-xs text-gray-500 mt-1">Delivery times & costs</p>
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <Link href="/faq" className="text-sm text-[#007185] hover:text-[#C7511F] flex items-center gap-1">
              View all FAQs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">How do I track my order?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                You can track your order by logging into your account and visiting the "Your Orders" section. 
                You'll also receive tracking updates via email and SMS once your order ships.
              </p>
              <Link href="/profile/orders" className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] mt-3">
                Track your order <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">What is your return policy?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We offer a 7-day replacement guarantee for defective or damaged products. 
                Items must be unused and in original packaging. Contact us to initiate a return.
              </p>
              <Link href="/returns-refunds" className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] mt-3">
                Learn about returns <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">Do you offer bulk discounts?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Yes, we offer special pricing for bulk orders. Contact our wholesale team with your requirements 
                and quantity for a custom quote.
              </p>
              <Link href="/wholesale" className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] mt-3">
                Request bulk quote <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">What payment methods do you accept?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We accept all major credit/debit cards, UPI, netbanking, and wallet payments through our 
                secure Razorpay payment gateway.
              </p>
              <Link href="/payment-methods" className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] mt-3">
                View payment methods <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Need more help? Contact us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone Support */}
            <div className="bg-[#F0F2F2] border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone className="w-6 h-6 text-[#e77600]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-sm text-gray-600 mb-2">Available Mon-Sat, 9AM - 7PM</p>
              <a href={`tel:${siteConfig.contact.phone.primary}`} className="text-lg font-bold text-[#007185] hover:text-[#C7511F] transition-colors block mb-1">
                {siteConfig.contact.phone.primary}
              </a>
              <a href={`tel:${siteConfig.contact.phone.secondary}`} className="text-lg font-bold text-[#007185] hover:text-[#C7511F] transition-colors block mb-1">
                {siteConfig.contact.phone.secondary}
              </a>
              <p className="text-xs text-gray-500">Standard call rates apply</p>
            </div>

            {/* Email Support */}
            <div className="bg-[#F0F2F2] border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail className="w-6 h-6 text-[#e77600]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-sm text-gray-600 mb-2">We reply within 24 hours</p>
              <a href={`mailto:${siteConfig.contact.email.orders}`} className="text-sm font-medium text-[#007185] hover:text-[#C7511F] transition-colors break-all">
                {siteConfig.contact.email.orders}
              </a>
              <p className="text-xs text-gray-500 mt-2">Include your order number for faster service</p>
            </div>

            {/* WhatsApp Support */}
            <div className="bg-[#F0F2F2] border border-gray-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-2">Quick responses via WhatsApp</p>
              <a href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#007185] hover:text-[#C7511F] transition-colors">
                Chat with us <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-gray-500 mt-2">Click to start conversation</p>
            </div>
          </div>
        </div>

        {/* Self-Service Tools */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-[#e77600]" />
            <h2 className="text-lg font-bold text-gray-900">Self-Service Tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/profile/orders" className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
              <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-[#e77600]" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Track Order</p>
                <p className="text-xs text-gray-500">View order status</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
            <Link href="/profile" className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
              <UserCheck className="w-5 h-5 text-gray-400 group-hover:text-[#e77600]" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Account Settings</p>
                <p className="text-xs text-gray-500">Update your profile</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
            <Link href="/returns-refunds" className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
              <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-[#e77600]" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Return Items</p>
                <p className="text-xs text-gray-500">Initiate a return</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
            <Link href="/profile/orders" className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#e77600]" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Download Invoice</p>
                <p className="text-xs text-gray-500">Get order receipts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-[#F0F2F2] border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#e77600]" />
                <h3 className="font-bold text-gray-900">Store Pickup Location</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {siteConfig.address.line1},<br />
                {siteConfig.address.city} - {siteConfig.address.pincode},<br />
                {siteConfig.address.state}, {siteConfig.address.country}
              </p>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(`${siteConfig.name} ${siteConfig.address.city}`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F] mt-3"
              >
                Get Directions <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-[#e77600]" />
                <h3 className="font-bold text-gray-900">Support Hours</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span className="font-medium">9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-medium">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Your privacy and security are important to us. All communications are encrypted and secure. 
                For urgent matters, please call our support line for immediate assistance.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}