import { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Your Cart',
  robots: { index: false, follow: false }, // SEO: Don't index the cart state
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}