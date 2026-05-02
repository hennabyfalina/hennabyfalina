// src/components/home/CategorySection.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/supabase/storage'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  product_count: number
}

interface CategorySectionProps {
  categories: Category[]
}

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section className="bg-white p-4 sm:p-6 rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
          Shop by Category
        </h2>
        <Link 
          href="/products" 
          className="text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
          See all
        </Link>
      </div>

      {/* Mobile: Horizontal Scroll with Snapping | Desktop: Grid */}
      <div className="flex overflow-x-auto gap-4 sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 sm:gap-6 no-scrollbar pb-2 touch-pan-x overscroll-contain-x snap-carousel">
        {categories.map((category) => {
          let imgUrl = '/placeholder-category.svg'
          if (category.image) {
            imgUrl = category.image.startsWith('http') 
              ? category.image 
              : getPublicUrl(category.image)
          }
          
          return (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="flex flex-col items-center gap-3 group min-w-[100px] sm:min-w-0 flex-shrink-0"
            >
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#F7F8F8] border border-gray-100 overflow-hidden relative flex items-center justify-center transition-all duration-300 group-hover:border-[#FBD18E] group-hover:shadow-md">
                <div className="relative w-full h-full p-3">
                  <Image
                    src={imgUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 80px, 112px"
                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                    unoptimized={imgUrl.includes('token=') || imgUrl.includes('supabase')}
                  />
                </div>
              </div>
              
              <span className="text-xs sm:text-sm font-medium text-gray-800 text-center line-clamp-2 leading-tight group-hover:text-[#C7511F] transition-colors">
                {category.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}