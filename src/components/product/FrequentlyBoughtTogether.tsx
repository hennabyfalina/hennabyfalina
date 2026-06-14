// src/components/product/FrequentlyBoughtTogether.tsx

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ShoppingBag, Check, BadgePercent, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { getPublicUrl } from '@/lib/supabase/storage'
import QuantitySelector from '@/components/product/QuantitySelector'
import { getEffectivePrice, isWholesaleActive } from '@/lib/pricing'
import type { Product as DBProduct } from '@/types/database.types'

interface Variant {
  name: string
  price: number
  variant_mrp?: number
  wholesale_price?: number
  wholesale_min_qty?: number
}

interface Product {
  mrp: number
  id: string
  name: string
  slug: string
  images: string[]
  stock: number
  category_id?: string | null
  description?: string | null
  rating?: number | null
  review_count?: number | null
  retail_price: number
  wholesale_price: number
  wholesale_min_qty: number
  variants?: string | Variant[]
}

interface SelectedItem {
  quantity: number
  variantName?: string
  price: number
  variantMrp?: number
  wholesalePrice?: number
  wholesaleMinQty?: number
}

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product
  bundleProducts: Product[]
}

export default function FrequentlyBoughtTogether({ mainProduct, bundleProducts }: FrequentlyBoughtTogetherProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({})
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const allProducts = [mainProduct, ...bundleProducts]

  // Helper: parse variants from product (handles string or array)
  const getVariants = (product: Product): Variant[] => {
    if (!product.variants) return []
    try {
      if (typeof product.variants === 'string') return JSON.parse(product.variants)
      if (Array.isArray(product.variants)) return product.variants
    } catch (e) {}
    return []
  }

  // Initialize selected items with first variant (if any)
  useEffect(() => {
    const initial: Record<string, SelectedItem> = {}
    allProducts.forEach(p => {
      if (p.stock > 0) {
        const variants = getVariants(p)
        if (variants.length > 0) {
          const first = variants[0]
          initial[p.id] = {
            quantity: 1,
            variantName: first.name,
            price: first.price,
            variantMrp: first.variant_mrp ?? p.mrp,
            wholesalePrice: first.wholesale_price,
            wholesaleMinQty: first.wholesale_min_qty,
          }
        } else {
          initial[p.id] = {
            quantity: 1,
            price: p.retail_price,
            variantMrp: p.mrp,
            wholesalePrice: p.wholesale_price,
            wholesaleMinQty: p.wholesale_min_qty,
          }
        }
      }
    })
    setSelectedItems(initial)
  }, [mainProduct, bundleProducts])

  if (!bundleProducts || bundleProducts.length === 0) return null

  const handleToggle = (id: string) => {
    if (id === mainProduct.id) return
    setSelectedItems(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else {
        const p = allProducts.find(x => x.id === id)
        if (p) {
          const variants = getVariants(p)
          if (variants.length > 0) {
            const first = variants[0]
            next[id] = {
              quantity: 1,
              variantName: first.name,
              price: first.price,
              variantMrp: first.variant_mrp ?? p.mrp,
              wholesalePrice: first.wholesale_price,
              wholesaleMinQty: first.wholesale_min_qty,
            }
          } else {
            next[id] = {
              quantity: 1,
              price: p.retail_price,
              variantMrp: p.mrp,
              wholesalePrice: p.wholesale_price,
              wholesaleMinQty: p.wholesale_min_qty,
            }
          }
        }
      }
      return next
    })
  }

  const handleQuantityChange = (id: string, qty: number) => {
    setSelectedItems(prev => {
      const item = prev[id]
      if (!item) return prev
      
      // Recalculate effective price based on new quantity
      const p = allProducts.find(x => x.id === id)
      if (!p) return prev
      
      const variants = getVariants(p)
      const variant = variants.find(v => v.name === item.variantName)
      const effectivePrice = getEffectivePrice(p as unknown as DBProduct, qty, variant as any)
      
      return {
        ...prev,
        [id]: {
          ...item,
          quantity: qty,
          price: effectivePrice,
        }
      }
    })
  }

  const handleVariantChange = (id: string, variant: Variant) => {
    setSelectedItems(prev => {
      const item = prev[id]
      if (!item) return prev
      
      // Calculate effective price with current quantity
      const p = allProducts.find(x => x.id === id)
      if (!p) return prev

      const effectivePrice = getEffectivePrice(p as unknown as DBProduct, item.quantity, variant as any)
      
      return {
        ...prev,
        [id]: {
          ...item,
          variantName: variant.name,
          price: effectivePrice,
          variantMrp: variant.variant_mrp ?? item.variantMrp,
          wholesalePrice: variant.wholesale_price,
          wholesaleMinQty: variant.wholesale_min_qty,
        }
      }
    })
  }

  // Build list of selected products with enriched pricing data
  const selectedProducts = allProducts.filter(p => !!selectedItems[p.id]).map(p => {
    const sel = selectedItems[p.id]
    const variants = getVariants(p)
    const variant = variants.find(v => v.name === sel.variantName)
    
    // Check if wholesale is currently applied
    const isWholesaleApplied = isWholesaleActive(p as unknown as DBProduct, sel.quantity, variant as any)
    
    return {
      ...p,
      effectivePrice: sel.price,
      effectiveMrp: sel.variantMrp ?? p.mrp,
      quantity: sel.quantity,
      variantName: sel.variantName,
      isWholesaleApplied,
      wholesaleMinQty: sel.wholesaleMinQty,
      wholesalePrice: sel.wholesalePrice,
    }
  })

  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.effectivePrice * p.quantity, 0)
  const totalMrp = selectedProducts.reduce((sum, p) => sum + (p.effectiveMrp * p.quantity), 0)
  const totalSavings = totalMrp - totalPrice

  const handleAddAllToCart = async () => {
    if (selectedProducts.length === 0) return
    
    setIsAdding(true)
    try {
      await Promise.all(selectedProducts.map(async (p) => {
        await addItem({
          product_id: p.id,
          name: p.variantName ? `${p.name} (${p.variantName})` : p.name,
          slug: p.slug,
          quantity: p.quantity,
          image: p.images?.[0] || '',
          stock: p.stock,
          category_id: p.category_id || null,
          description: p.description || null,
          retail_price: p.effectivePrice,
          wholesale_price: p.wholesale_price,
          wholesale_min_qty: p.wholesale_min_qty,
          rating: p.rating || null,
          review_count: p.review_count || null,
          mrp: p.effectiveMrp,
          variant_string: p.variantName
        })
      }))
      showToast(`Added ${selectedProducts.length} curated items to your bag`, 'success')
    } catch (error) {
      showToast('Failed to add some items', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white pt-0 select-none font-sans antialiased text-left w-full pb-12">
      
      <div className="w-full text-center py-0 md:py-4 pb-6 flex flex-col items-center justify-center gap-1">
        <h2 className="text-3xl sm:text-4xl font-normal text-gray-950 tracking-tight capitalize">
          frequently bought together
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-normal">
          curated product pairings optimized for the perfect long-lasting henna stain
        </p>
      </div>

      <div className="max-w-[750px] mx-auto w-full flex flex-col gap-5">
        
        <div className="flex flex-col w-full">
          {allProducts.map((p) => {
            const sel = selectedItems[p.id]
            const isSelected = !!sel
            const isOutOfStock = p.stock <= 0
            const isMain = p.id === mainProduct.id

            const variants = getVariants(p)
            const currentVariant = variants.find(v => v.name === sel?.variantName)
            const displayPrice = sel?.price ?? p.retail_price
            const displayMrp = sel?.variantMrp ?? p.mrp
            const isWholesaleApplied = sel?.wholesalePrice && sel?.wholesaleMinQty && sel.quantity >= sel.wholesaleMinQty

            let imgUrl = '/placeholder-product.svg'
            if (p.images?.[0]) {
              imgUrl = p.images[0].startsWith('http') ? p.images[0] : getPublicUrl(p.images[0])
            }

            return (
              <div 
                key={p.id} 
                className={`flex items-center gap-4 sm:gap-6 py-6 border-b border-gray-100 last:border-none w-full transition-opacity group ${
                  isOutOfStock ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <label className="relative shrink-0 flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isOutOfStock || isMain}
                    onChange={() => handleToggle(p.id)}
                    className="sr-only"
                  />
                  <div className={`w-[20px] h-[20px] rounded border transition-all duration-200 flex items-center justify-center ${
                    isMain ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' :
                    isSelected ? 'bg-gray-950 border-gray-950 text-white' : 'border-gray-200 bg-white group-hover:border-gray-400'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                  </div>
                </label>

                <div className={`relative w-20 h-20 bg-stone-50/40 border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 transition-all ${
                  !isSelected ? 'opacity-40 grayscale' : ''
                }`}>
                  <Image 
                    src={imgUrl}
                    alt={p.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                    unoptimized={imgUrl.startsWith('http') || imgUrl.includes('supabase')}
                  />
                </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 min-w-0 pr-1 text-[16px]">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-gray-700 group-hover:text-gray-950 transition-colors capitalize font-medium block whitespace-nowrap">
                      {p.name.toLowerCase()}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {isMain && (
                        <span className="font-normal text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded lowercase">
                          this item
                        </span>
                      )}
                      {isSelected && isWholesaleApplied && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5" strokeWidth={2} />
                          bulk rate
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && !isOutOfStock && variants.length > 0 && (
                    <div className="shrink-0 md:min-w-[120px]">
                      <select
                        value={sel?.variantName || ''}
                        aria-label={`Select variant for ${p.name}`}
                        onChange={(e) => {
                          const v = variants.find(v => v.name === e.target.value)
                          if (v) handleVariantChange(p.id, v)
                        }}
                        className="h-9 w-full px-3 border border-gray-200 rounded-lg text-[13px] font-medium bg-white focus:outline-none focus:border-gray-950 transition-all cursor-pointer"
                      >
                        {variants.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.name}
                            {v.wholesale_min_qty && v.wholesale_price && ` (${v.wholesale_min_qty}+ → ${formatCurrency(v.wholesale_price)})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isSelected && !isOutOfStock && (
                    <div className="scale-90 origin-left md:origin-center shrink-0">
                      <QuantitySelector 
                        quantity={sel.quantity} 
                        onQuantityChange={(q) => handleQuantityChange(p.id, q)}
                        max={p.stock}
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-end shrink-0 ml-auto min-w-[90px] md:mt-0 -mt-10">
                    <span className="font-normal text-gray-950 text-[17px]">
                      {formatCurrency(displayPrice)}
                    </span>
                    {displayMrp && displayMrp > displayPrice && (
                      <span className="text-gray-300 line-through font-normal text-[13px] sm:text-[15px] -mt-1">
                        {formatCurrency(displayMrp)}
                      </span>
                    )}
                    {isSelected && isWholesaleApplied && (
                      <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        {formatCurrency(sel.price)}/unit
                      </span>
                    )}
                  </div>
                  
                  {isOutOfStock && (
                    <span className="text-red-500 font-normal text-[14px] shrink-0 lowercase">
                      (sold out)
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-8 border-t border-gray-200 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mt-4">
          <div className="flex flex-col items-start gap-1">
            <p className="text-gray-400 text-[14px] font-normal">
              Selected combination ({selectedProducts.length} items)
            </p>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-[15px] text-gray-400 font-normal">Bundle total:</span>
              <span className="text-3xl font-bold text-gray-950 tracking-tight">
                {formatCurrency(totalPrice)}
              </span>
              {totalSavings > 0 && (
                <span className="text-[13px] font-normal text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full ml-2 flex items-center gap-1.5">
                  <BadgePercent className="w-5 h-5 fill-emerald-600 text-white" strokeWidth={1.5} />
                  You&apos;ll save {formatCurrency(totalSavings)}
                </span>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleAddAllToCart}
            disabled={isAdding || selectedProducts.length === 0}
            className="w-full sm:w-auto h-14 bg-gray-950 hover:bg-black text-white font-bold text-[15px] px-10 rounded-full transition-all duration-200 disabled:opacity-30 cursor-pointer flex items-center justify-center gap-3 shadow-md active:scale-[0.98] shrink-0"
          >
            {isAdding ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5" strokeWidth={2} />
            )}
            <span>{isAdding ? 'Adding combo...' : 'Add Bundle to Bag'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}