// src/app/(shop)/wishlist/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFullWishlist } from '@/services/wishlist.service'
import Container from '@/components/ui/Container'
import WishlistClient from './WishlistClient'

export const metadata = {
  title: 'Your Wishlist | Razack Packaging'
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Secure the route
  if (!session) {
    redirect('/login?redirect=/wishlist')
  }

  // Fetch the initial data server-side for speed and SEO
  const wishlistItems = await getFullWishlist()

  return (
    <div className="min-h-screen bg-[#F0F2F2] py-8">
      <Container>
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight">Your Wishlist</h1>
        </div>

        {/* 🚨 Pass data to the Client Component for real-time reactivity */}
        <WishlistClient initialItems={wishlistItems} />
        
      </Container>
    </div>
  )
}