// src/app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CartSyncProvider from '@/components/CartSyncProvider'
import { siteConfig } from '@/config/site'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://razackpackagingcentre.com'),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://razackpackagingcentre.com',
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: '/icon-512x512.png', // Fallback to your highest quality app icon
        width: 512,
        height: 512,
        alt: `${siteConfig.name} Logo`,
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  alternates: {
    canonical: '/',
  }
}

const globalJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": siteConfig.name,
  "image": "https://razackpackagingcentre.com/icon-512x512.png", 
  "telephone": siteConfig.contact.phone.primary,
  "email": siteConfig.contact.email.orders,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": siteConfig.address.line1,
    "streetAddress2": siteConfig.address.line2,
    "addressLocality": siteConfig.address.city,
    "addressRegion": siteConfig.address.state,
    "postalCode": siteConfig.address.pincode,
    "addressCountry": "IN"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "opens": "10:00",
    "closes": "20:00"
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {supabaseUrl && (
          <>
            <link rel="preconnect" href={supabaseUrl} />
            <link rel="dns-prefetch" href={supabaseUrl} />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body 
        className="bg-white text-gray-900 antialiased w-full min-h-screen flex flex-col overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
        <CartSyncProvider />
      </body>
    </html>
  )
}