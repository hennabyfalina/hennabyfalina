// src/app/(shop)/wishlist/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFullWishlist } from '@/services/wishlist.service'
import Container from '@/components/ui/Container'
import WishlistClient from './WishlistClient'
import { siteConfig } from '@/config/site'

export const metadata = {
  title: `Your Wishlist | ${siteConfig.name} Studio`
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?next=/wishlist')
  }

  const wishlistItems = await getFullWishlist()

  return (
    <div className="min-h-screen bg-white py-8 md:py-14 select-none animate-in fade-in duration-300">
      <Container className="max-w-[1400px] px-4 sm:px-8">
        <WishlistClient initialItems={wishlistItems} />
      </Container>
    </div>
  )
}