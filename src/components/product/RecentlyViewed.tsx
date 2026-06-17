// src/components/product/RecentlyViewed.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/types/database.types'

export default function RecentlyViewed() {
  const [mounted, setMounted] = useState(false)
  const [recentItems, setRecentItems] = useState<Product[]>([])

  useEffect(() => {
    setMounted(true)
    try {
      const storageKey = 'hennabyfalina_recently_viewed'
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        
        if (Array.isArray(parsed)) {
          // ⚡ HIGH-PERFORMANCE DATA MIGRATION GATE: Maps legacy keys into new schema properties dynamically
          const normalizedItems = parsed.map((item: any) => {
            // Check if the item contains legacy naming schemes instead of your active columns
            const legacyPrice = item.price || item.selling_price || 0;
            const legacyMrp = item.mrp || item.price || 0;

            return {
              ...item,
              // If retail_price column is empty or missing, fallback onto legacy object keys safely
              retail_price: item.retail_price !== undefined ? item.retail_price : legacyPrice,
              mrp: item.mrp !== undefined ? item.mrp : legacyMrp,
              
              // Ensure critical new boolean feature flags maintain stable default state parameters
              is_retail_enabled: item.is_retail_enabled ?? true,
              is_wholesale_enabled: item.is_wholesale_enabled ?? false,
              is_variants_enabled: item.is_variants_enabled ?? false,
              variants: item.variants ?? '[]'
            }
          })

          // Secure save to clean up the user's browser storage automatically for future render passes
          localStorage.setItem(storageKey, JSON.stringify(normalizedItems.slice(0, 15)))
          setRecentItems(normalizedItems as Product[])
        }
      }
    } catch (e) {
      console.error('Failed to migrate or load recently viewed cache metrics:', e)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="w-full mt-10 pb-6 min-h-[300px] select-none font-sans antialiased text-center flex flex-col items-center">
        <div className="h-5 w-44 bg-stone-100 rounded-md mb-8 animate-pulse" />
        <div className="flex gap-4 sm:gap-6 overflow-hidden w-full justify-start md:justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[180px] sm:w-[220px] aspect-square bg-stone-50/60 border border-gray-100/40 animate-pulse rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  if (recentItems.length === 0) {
    return (
      <div className="w-full mt-10 py-12 text-center select-none font-sans antialiased flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full bg-stone-50/60 flex items-center justify-center border border-gray-100/50 text-gray-400">
          <Eye className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h3 className="text-[25px] font-normal text-gray-950 capitalize">
            Your history is empty
          </h3>
          <p className="text-[15px] text-gray-400 font-normal max-w-xs mx-auto leading-relaxed capitalize">
            Products you browse while exploring our boutique studio will appear here.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center px-6 bg-gray-950 hover:bg-black text-white rounded-xl text-[13px] font-medium transition-colors cursor-pointer lowercase outline-none active:scale-[0.99]"
          >
            Start Browsing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mt-10 select-none font-sans antialiased flex flex-col gap-6" suppressHydrationWarning>
      <div className="w-full text-center py-2 flex flex-col items-center justify-center">
        <h3 className="text-3xl sm:text-4xl font-normal text-gray-950 tracking-tight capitalize">
          Recently Viewed
        </h3>
      </div>

      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
        {recentItems.map((product) => (
          <div 
            key={product.id} 
            className="w-[180px] sm:w-[220px] flex-shrink-0 snap-start px-0.5"
          >
            <ProductCard product={product} priority={false} />
          </div>
        ))}
      </div>
    </div>
  )
}