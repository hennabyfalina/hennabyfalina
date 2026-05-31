// src/components/product/FrequentlyBoughtTogether.tsx

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import { Product } from '@/components/product/ProductCard'

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product
  bundleProducts: Product[]
}

export default function FrequentlyBoughtTogether({ mainProduct, bundleProducts }: FrequentlyBoughtTogetherProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const allProducts = [mainProduct, ...bundleProducts]
  const fallbackMinQty = 100 // Enterprise fallback standard benchmark criteria

  useEffect(() => {
    setSelectedIds(allProducts.filter(p => p.stock > 0).map(p => p.id))
  }, [mainProduct, bundleProducts])

  if (!bundleProducts || bundleProducts.length === 0) return null

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const selectedProducts = allProducts.filter(p => selectedIds.includes(p.id))
  
  // 🔒 SECURE ENTERPRISE CALCULATION: Read cached column values directly to compute total dynamic bundle price
  const totalPrice = selectedProducts.reduce((sum, p) => {
    const tiers = p.pricing_tiers || []
    const tier = tiers.length > 0 ? tiers[0] : null
    const price = tier ? tier.selling_price : (p.selling_price ?? p.price)
    const qty = (p as any).min_order_qty ?? fallbackMinQty
    return sum + (price * qty)
  }, 0)
  
  // 🔒 SECURE ENTERPRISE CALCULATION: Read cached column values directly to compute total bundle regular MRP price
  const totalRegularPrice = selectedProducts.reduce((sum, p) => {
    const tiers = p.pricing_tiers || []
    const tier = tiers.length > 0 ? tiers[0] : null
    const mrp = tier ? tier.mrp : p.price
    const qty = (p as any).min_order_qty ?? fallbackMinQty
    return sum + (mrp * qty)
  }, 0)

  const handleAddAllToCart = async () => {
    if (selectedProducts.length === 0) return
    
    setIsAdding(true)
    try {
      await Promise.all(selectedProducts.map(async (p) => {
        const tiers = p.pricing_tiers || []
        const tier = tiers.length > 0 ? tiers[0] : null
        await addItem({
          product_id: p.id,
          name: p.name,
          slug: p.slug,
          price: tier ? tier.selling_price : (p.selling_price ?? p.price),
          // 🔒 Ensure the dispatch action pushes the exact dedicated database column value
          quantity: (p as any).min_order_qty ?? fallbackMinQty,
          image: p.images?.[0] || '',
          stock: p.stock,
          category_id: p.category_id || null,
          description: p.description || null,
          original_price: p.price,
          rating: p.rating || null,
          review_count: p.review_count || null,
          selling_price: p.selling_price || p.price,
          printing_type: tier ? tier.tier_name : 'Retail (Readymade)',
          artwork_urls: [],
          artwork_sizes: [],
          printing_instructions: null,
          pricing_tiers: p.pricing_tiers || []
        })
      }))
      showToast(`${selectedProducts.length} items added to cart`, 'success')
    } catch (error) {
      showToast('Failed to add some items', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 pt-8 mt-8">
      <h2 className="text-xl font-bold text-[#0F1111] mb-5">Frequently bought together</h2>
      
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* Images Row - Horizontal Scroll on Mobile */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
          <div className="flex items-center">
            {allProducts.map((p, index) => {
              const isSelected = selectedIds.includes(p.id)
              const isOutOfStock = p.stock <= 0
              
              // 🔒 Print database column values flawlessly inside the image badges
              const retailMin = (p as any).min_order_qty ?? fallbackMinQty

              let imgUrl = '/placeholder-product.svg'
              if (p.images?.[0]) {
                imgUrl = p.images[0].startsWith('http') ? p.images[0] : getPublicUrl(p.images[0])
              }

              return (
                <div key={p.id} className="flex items-center">
                  <Link href={`/product/${p.slug}`} className={`relative w-32 h-32 block p-2 transition-colors group ${!isSelected || isOutOfStock ? 'opacity-50' : ''}`}>
                    {!isOutOfStock && (
                      <div className="absolute top-1 left-1 z-10 bg-[#CC0C39] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm uppercase tracking-tighter">
                        Min: {retailMin}
                      </div>
                    )}
                    <Image src={imgUrl} alt={p.name} fill sizes="128px" className="object-contain" unoptimized={imgUrl.startsWith('http') || imgUrl.includes('supabase')} />
                  </Link>
                  {index < allProducts.length - 1 && (
                    <div className="mx-4 text-gray-500 font-bold text-xl">
                      <Plus className="w-5 h-5" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Box */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3 pt-2 lg:pl-4">
          <div className="flex flex-col items-start gap-0.5">
            <p className="text-gray-500 text-xs font-medium">
              Selected Bundle Subtotal ({selectedProducts.length} items):
            </p>
            <p className="text-[#111827] text-sm font-medium">
              Total price: <span className="text-2xl font-bold text-[#B12704]">{formatCurrency(totalPrice)}</span>
            </p>
          </div>
          {totalRegularPrice > totalPrice && (
             <div className="text-sm text-[#565959]">
               M.R.P.: <span className="line-through">{formatCurrency(totalRegularPrice)}</span>
             </div>
          )}
          
          <button 
            onClick={handleAddAllToCart}
            disabled={isAdding || selectedProducts.length === 0}
            className="w-full py-2 px-4 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-medium rounded-full transition-colors border border-[#FCD200] shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isAdding ? <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {isAdding ? 'Adding...' : 'Add all to Cart'}
          </button>
        </div>
      </div>

      {/* Checkbox List */}
      <div className="mt-6 flex flex-col gap-3">
        {allProducts.map((p) => {
          const isSelected = selectedIds.includes(p.id)
          const isOutOfStock = p.stock <= 0
          const isMain = p.id === mainProduct.id
          const tiers = p.pricing_tiers || []
          const tier = tiers.length > 0 ? tiers[0] : null
          const sellingPrice = tier ? tier.selling_price : (p.selling_price ?? p.price)
          
          // 🔒 Read the simplified property fallback column extraction straight from the row context
          const qty = (p as any).min_order_qty ?? fallbackMinQty

          return (
            <label key={p.id} className={`flex items-start gap-3 ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isOutOfStock}
                onChange={() => handleToggle(p.id)}
                className="mt-1 w-4 h-4 text-[#007185] border-gray-400 rounded-sm focus:ring-[#007185] cursor-pointer"
              />
              <div className="flex-1 text-sm leading-tight pt-0.5 flex flex-wrap items-center">
                <Link href={`/product/${p.slug}`} className="text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
                  {isMain && <span className="font-bold text-[#0F1111]">This item: </span>}
                  {p.name}
                </Link>
                <span className="font-bold text-[#B12704] ml-2">
                  {formatCurrency(sellingPrice * qty)}
                </span>
                
                {/* Clean inline MRP presentation striking out matching batch values natively */}
                {(tier?.mrp || p.price) > sellingPrice && (
                  <span className="text-xs text-gray-400 font-normal line-through ml-2">
                    MRP: {formatCurrency((tier?.mrp || p.price) * qty)}
                  </span>
                )}
                
                {/* 🗑️ Duplicate text-badge removed completely to clean up grid space visual clutter */}
                
                {isOutOfStock && <span className="text-[#B12704] ml-2 font-medium">(Out of Stock)</span>}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}