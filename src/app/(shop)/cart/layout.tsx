// src/app/(shop)/cart/layout.tsx

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Cart | Henna By Falina',
  // SEO Safeguard: Private checkout states must never enter global crawler index matrices
  robots: { index: false, follow: false }, 
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}