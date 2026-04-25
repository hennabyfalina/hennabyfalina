import { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Secure Checkout',
  robots: { index: false, follow: false }, // SEO: Prevent search engines from indexing transactional pages
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}