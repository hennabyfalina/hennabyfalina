// src/app/layout.tsx

import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import CartSyncProvider from '@/components/CartSyncProvider'
import InstallPrompt from '@/components/ui/InstallPrompt'
import PWAUpdater from '@/components/ui/PWAUpdater'
import WishlistProvider from '@/components/providers/WishlistProvider'
import { siteConfig } from '@/config/site'
import { Analytics } from '@vercel/analytics/next'
import SplashScreen from '@/components/ui/SplashScreen'
import BroadcastListener from '@/components/providers/BroadcastListener'

const inter = localFont({
  src: '../../public/fonts/Inter-Sans-VariableFont.ttf',
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://hennabyfalina.com'),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hennabyfalina.com',
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: `${siteConfig.name} Visual Identity Logo`,
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
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.shortName,
  },
  formatDetection: {
    telephone: false,
  }
}

const globalJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": siteConfig.name,
  "image": "https://hennabyfalina.com/icon-512x512.png", 
  "telephone": siteConfig.contact.phone.primary,
  "email": siteConfig.contact.email.orders,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": siteConfig.address.line1,
    "streetAddress2": siteConfig.address.line2 || "",
    "addressLocality": siteConfig.address.city,
    "addressRegion": siteConfig.address.state,
    "postalCode": siteConfig.address.pincode,
    "addressCountry": "IN"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "opens": "09:00 AM",
    "closes": "21:00 PM"
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    // 🚀 FIXED: Deep Dark pure token alignment matching your exact IDE workspace preference
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html lang="en" className={`${inter.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {supabaseUrl && (
          <>
            <link rel="preconnect" href={supabaseUrl} />
            <link rel="dns-prefetch" href={supabaseUrl} />
          </>
        )}
        <script
          id="schema-local-business"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      {/* 🚀 FIXED: Polished base configuration class profiles to map into sterile clean monochrome layouts */}
      <body 
        className="bg-white text-gray-900 antialiased w-full min-h-[100dvh] flex flex-col selection:bg-gray-900 selection:text-white"
        suppressHydrationWarning
      >
        <SplashScreen />
        <WishlistProvider>
          {children}
          <CartSyncProvider />
          <InstallPrompt />
          <PWAUpdater />
          <Analytics />
          <BroadcastListener />
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </WishlistProvider>
      </body>
    </html>
  )
}