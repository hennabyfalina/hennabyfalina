// src/store/cart.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { broadcast } from '@/lib/broadcast'
import { parseVariants } from '@/lib/pricing'

export interface CartItem {
  id: string
  product_id: string
  name: string
  slug: string
  price: number // Dynamically calculated active price (Retail, Wholesale, or Variant tier)
  original_price: number // 🆕 FIXED: Captures pre-discount base price to resolve ts(2339)
  quantity: number
  image: string
  stock: number
  category_id: string | null
  description?: string | null
  variant_string?: string | null 
  bundle_title?: string | null   
  
  // 🏛️ BIG-TECH STRATEGIC MODES FEATURE FLAGS
  is_retail_enabled: boolean
  is_wholesale_enabled: boolean
  is_variants_enabled: boolean

  // Mapped direct column records from our purified schema
  retail_price: number
  wholesale_price: number | null
  wholesale_min_qty: number | null
  mrp: number
  variants?: any // Cached local configurations snapshot for secure offline price validation loops
  
  rating?: number | null
  review_count?: number | null
  version?: number  // Optimistic locking version
}

interface CartState {
  persistCartClear: () => Promise<void>
  items: CartItem[]
  isLoading: boolean
  alerts: string[] 
  clearAlerts: () => void
  addItem: (item: Omit<CartItem, 'id' | 'price' | 'original_price' | 'version'>) => Promise<void>
  updateItem: (id: string, updates: Partial<Omit<CartItem, 'id' | 'version'>>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncWithDatabase: (userId: string) => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  loadCart: () => Promise<void>
  refreshCartPrices: () => Promise<void>
  findCartItem: (productId: string, variantString?: string) => CartItem | undefined
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * 🔒 UNIFIED BASE PRICE CALCULATOR
 * Extracts the standard non-wholesale rate for standard items or variants
 */
const calculateOriginalPrice = (item: {
  retail_price: number
  is_variants_enabled: boolean
  variant_string?: string | null
  variants?: any
}): number => {
  if (item.is_variants_enabled && item.variants) {
    const parsed = parseVariants(item.variants)
    const matched = parsed.find(v => v.name === item.variant_string)
    if (matched) return matched.price
  }
  return item.retail_price
}

/**
 * 🔒 UNIFIED PRICE RESOLVER ENGINE (Client-Side State Mirror)
 * Enforces our exact multi-mode priority logic rules accurately
 */
const calculateActivePrice = (item: {
  quantity: number
  retail_price: number
  wholesale_price: number | null
  wholesale_min_qty: number | null
  is_retail_enabled: boolean
  is_wholesale_enabled: boolean
  is_variants_enabled: boolean
  variant_string?: string | null
  variants?: any
}): number => {
  const qty = item.quantity

  // 1. Process Variant Pricing Branches First
  if (item.is_variants_enabled && item.variants) {
    const parsed = parseVariants(item.variants)
    const matched = parsed.find(v => v.name === item.variant_string)
    if (matched) {
      if (item.is_wholesale_enabled) {
        const vMinQty = matched.wholesale_min_qty ?? item.wholesale_min_qty
        const vWholesalePrice = matched.wholesale_price ?? item.wholesale_price
        if (vMinQty && vWholesalePrice && qty >= vMinQty) {
          return vWholesalePrice
        }
      }
      return matched.price
    }
  }

  // 2. Process Standard B2B Wholesale Volume Rules Second
  if (item.is_wholesale_enabled && item.wholesale_price && item.wholesale_min_qty && qty >= item.wholesale_min_qty) {
    return item.wholesale_price
  }

  // 3. Fallback onto Active Retail Configuration Rates
  return item.is_retail_enabled ? item.retail_price : (item.wholesale_price || 0)
}

const incrementVersion = (item: CartItem): CartItem => ({
  ...item,
  version: (item.version || 0) + 1
})

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      alerts: [],
      clearAlerts: () => set({ alerts: [] }),

      persistCartClear: async () => {
        await get().clearCart()
      },

      findCartItem: (productId, variantString) => {
        return get().items.find((item) => item.product_id === productId && (item.variant_string || null) === (variantString || null))
      },

      addItem: async (newItem) => {
        let finalQuantity = newItem.quantity

        set((state) => {
          const currentItems = state.items
          const existingItem = currentItems.find((item) => 
            item.product_id === newItem.product_id && 
            (item.variant_string || null) === (newItem.variant_string || null)
          )
          let updatedItems: CartItem[]

          if (existingItem) {
            const newQuantity = existingItem.quantity + newItem.quantity
            finalQuantity = newQuantity
            if (newQuantity > newItem.stock) {
              throw new Error(`Only ${newItem.stock} items available in stock metadata profiles.`)
            }
            
            updatedItems = currentItems.map((item) =>
              item.id === existingItem.id
                ? incrementVersion({ 
                    ...item, 
                    quantity: newQuantity,
                    price: calculateActivePrice({ ...item, quantity: newQuantity }),
                    original_price: calculateOriginalPrice({ ...item })
                  })
                : item
            )
          } else {
            const cartItem: CartItem = {
              ...newItem,
              id: generateId(),
              version: 1,
              price: calculateActivePrice({ ...newItem }),
              original_price: calculateOriginalPrice({ ...newItem })
            }
            updatedItems = [...currentItems, cartItem]
          }

          return { items: updatedItems, isLoading: false }
        })
        
        broadcast.send({ type: 'CART_ITEM_ADDED', productId: newItem.product_id })

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          let query = supabase
            .from('cart_items')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('product_id', newItem.product_id)
            
          if (newItem.variant_string) {
            query = query.eq('variant_string', newItem.variant_string)
          } else {
            query = query.is('variant_string', null)
          }

          const { data: existing } = await query.maybeSingle()
            
          if (existing) {
            await supabase.from('cart_items').update({ quantity: finalQuantity }).eq('id', existing.id)
          } else {
            const { error } = await supabase.from('cart_items').insert({ 
              user_id: session.user.id, 
              product_id: newItem.product_id, 
              quantity: finalQuantity,
              variant_string: newItem.variant_string || null
            })
            if (error && error.code === '23505') {
              await supabase.from('cart_items').update({ 
                quantity: finalQuantity,
                variant_string: newItem.variant_string || null
              }).eq('user_id', session.user.id).eq('product_id', newItem.product_id)
            }
          }
        }
      },

      updateItem: async (id, updates) => {
        let targetProductId: string | null = null
        let targetVariantString: string | null = null
        let newQuantity: number | null = null

        set((state) => {
          const currentItems = state.items
          const itemIndex = currentItems.findIndex(i => i.id === id)

          if (itemIndex === -1) throw new Error('Item not found')

          const oldItem = currentItems[itemIndex]
          targetProductId = oldItem.product_id
          targetVariantString = oldItem.variant_string || null
          const merged = { ...oldItem, ...updates }
          newQuantity = merged.quantity
          
          const updatedItems = [...currentItems]
          updatedItems[itemIndex] = incrementVersion({
            ...merged,
            price: calculateActivePrice(merged),
            original_price: calculateOriginalPrice(merged)
          })

          return { items: updatedItems, isLoading: false }
        })

        if (targetProductId && newQuantity !== null) {
          broadcast.send({ type: 'CART_ITEM_UPDATED', productId: targetProductId })
          
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            let query = supabase.from('cart_items')
              .update({ quantity: newQuantity })
              .eq('user_id', session.user.id)
              .eq('product_id', targetProductId)
            
            if (targetVariantString) {
              query = query.eq('variant_string', targetVariantString)
            } else {
              query = query.is('variant_string', null)
            }
            await query
          }
        }
      },

      removeItem: async (id: string) => {
        let targetProductId: string | null = null
        let targetVariantString: string | null = null

        set((state) => {
          const itemToRemove = state.items.find(i => i.id === id)
          if (itemToRemove) {
            targetProductId = itemToRemove.product_id
            targetVariantString = itemToRemove.variant_string || null
          }
          return { items: state.items.filter((item) => item.id !== id), isLoading: false }
        })

        if (targetProductId) {
          broadcast.send({ type: 'CART_ITEM_DELETED', productId: targetProductId })

          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
             let query = supabase.from('cart_items')
               .delete()
               .eq('user_id', session.user.id)
               .eq('product_id', targetProductId)
               
             if (targetVariantString) {
               query = query.eq('variant_string', targetVariantString)
             } else {
               query = query.is('variant_string', null)
             }
             await query
          }
        }
      },

      updateQuantity: async (id: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(id)
          return
        }

        let targetProductId: string | null = null
        let targetVariantString: string | null = null

        set((state) => {
          const item = state.items.find((i) => i.id === id)
          if (item && quantity > item.stock) {
            throw new Error(`Only ${item.stock} units remain available in catalog inventory.`)
          }
          if (item) {
            targetProductId = item.product_id
            targetVariantString = item.variant_string || null
          }

          const updatedItems = state.items.map((item) => {
            if (item.id === id) {
              return incrementVersion({
                ...item,
                quantity,
                price: calculateActivePrice({ ...item, quantity }),
                original_price: calculateOriginalPrice({ ...item })
              })
            }
            return item
          })
          
          return { items: updatedItems, isLoading: false }
        })

        if (targetProductId) {
          broadcast.send({ type: 'CART_ITEM_UPDATED', productId: targetProductId })
          
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
             let query = supabase.from('cart_items')
               .update({ quantity })
               .eq('user_id', session.user.id)
               .eq('product_id', targetProductId)
               
             if (targetVariantString) {
               query = query.eq('variant_string', targetVariantString)
             } else {
               query = query.is('variant_string', null)
             }
             await query
          }
        }
      },

      clearCart: async () => {
        set({ isLoading: true, items: [] })
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await supabase.from('cart_items').delete().eq('user_id', session.user.id)
        }
        set({ isLoading: false })
      },

      syncWithDatabase: async (userId: string) => {
        const supabase = createClient()
        const localItems = get().items

        if (localItems.length > 0) {
           const { data: dbItems } = await supabase.from('cart_items').select('product_id, quantity, variant_string').eq('user_id', userId)
           const dbMap = new Map((dbItems || []).map(i => [`${i.product_id}|${i.variant_string || ''}`, i.quantity]))
           
           for (const item of localItems) {
             const key = `${item.product_id}|${item.variant_string || ''}`
             if (dbMap.has(key)) {
               const mergedQty = Math.max(dbMap.get(key)!, item.quantity)
               let query = supabase.from('cart_items').update({ quantity: mergedQty }).eq('user_id', userId).eq('product_id', item.product_id)
               
               if (item.variant_string) {
                 query = query.eq('variant_string', item.variant_string)
               } else {
                 query = query.is('variant_string', null)
               }
               await query
             } else {
               const { error } = await supabase.from('cart_items').insert({ 
                 user_id: userId, 
                 product_id: item.product_id, 
                 quantity: item.quantity,
                 variant_string: item.variant_string || null
               })
               if (error && error.code === '23505') {
                 await supabase.from('cart_items').update({ 
                   quantity: item.quantity,
                   variant_string: item.variant_string || null
                 }).eq('user_id', userId).eq('product_id', item.product_id)
               }
             }
           }
           await get().loadCart() 
        }
      },

      loadCart: async () => {
        set({ isLoading: true })
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: dbItems, error } = await supabase
            .from('cart_items')
            .select('*, products(id, name, slug, retail_price, wholesale_price, wholesale_min_qty, mrp, stock, category_id, description, images, rating, review_count, variants, is_retail_enabled, is_wholesale_enabled, is_variants_enabled)') 
            .eq('user_id', session.user.id)

          if (!error && dbItems && dbItems.length > 0) {
            const loadedItems: CartItem[] = dbItems.filter((item) => item.products !== null).map((item) => {
                const prod = item.products
                
                return {
                  id: item.id,
                  product_id: item.product_id,
                  name: item.variant_string ? `${prod.name} (${item.variant_string})` : prod.name,
                  slug: prod.slug,
                  quantity: item.quantity,
                  image: prod.images?.[0] || '',
                  stock: prod.stock,
                  category_id: prod.category_id,
                  description: prod.description,
                  is_retail_enabled: prod.is_retail_enabled,
                  is_wholesale_enabled: prod.is_wholesale_enabled,
                  is_variants_enabled: prod.is_variants_enabled,
                  retail_price: prod.retail_price,
                  wholesale_price: prod.wholesale_price,
                  wholesale_min_qty: prod.wholesale_min_qty,
                  mrp: prod.mrp || prod.retail_price,
                  variants: prod.variants,
                  rating: prod.rating,
                  review_count: prod.review_count,
                  variant_string: item.variant_string || null,
                  price: calculateActivePrice({
                    quantity: item.quantity,
                    retail_price: prod.retail_price,
                    wholesale_price: prod.wholesale_price,
                    wholesale_min_qty: prod.wholesale_min_qty,
                    is_retail_enabled: prod.is_retail_enabled,
                    is_wholesale_enabled: prod.is_wholesale_enabled,
                    is_variants_enabled: prod.is_variants_enabled,
                    variant_string: item.variant_string || null,
                    variants: prod.variants
                  }),
                  original_price: calculateOriginalPrice({
                    retail_price: prod.retail_price,
                    is_variants_enabled: prod.is_variants_enabled,
                    variant_string: item.variant_string || null,
                    variants: prod.variants
                  })
                }
              })
            set({ items: loadedItems })
          }
        }
        set({ isLoading: false })
      },

      refreshCartPrices: async () => {
        const currentItems = get().items
        if (currentItems.length === 0) return
        const supabase = createClient()
        const productIds = currentItems.map((item) => item.product_id)
        
        const { data: products, error } = await supabase
          .from('products')
          .select('id, name, retail_price, wholesale_price, wholesale_min_qty, mrp, stock, is_deleted, is_active, variants, is_retail_enabled, is_wholesale_enabled, is_variants_enabled')
          .in('id', productIds)

        if (error) return 

        if (products) {
          const newAlerts: string[] = []
          const validItems: CartItem[] = []

          for (const item of currentItems) {
            const product = products.find((p) => p.id === item.product_id)
            
            if (!product) {
              validItems.push(item)
              continue
            }
            
            if (product.is_deleted || !product.is_active) {
              newAlerts.push(`"${item.name}" is no longer available and has been safely removed from your cart.`)
              continue
            }

            const newPrice = calculateActivePrice({
              quantity: item.quantity,
              retail_price: product.retail_price,
              wholesale_price: product.wholesale_price,
              wholesale_min_qty: product.wholesale_min_qty,
              is_retail_enabled: product.is_retail_enabled,
              is_wholesale_enabled: product.is_wholesale_enabled,
              is_variants_enabled: product.is_variants_enabled,
              variant_string: item.variant_string,
              variants: product.variants
            })
            
            if (item.price !== newPrice && item.price !== 0) {
              newAlerts.push(`The price of "${item.name}" has updated to ₹${newPrice}.`)
            }

            validItems.push({
              ...item,
              price: newPrice,
              original_price: calculateOriginalPrice({
                retail_price: product.retail_price,
                is_variants_enabled: product.is_variants_enabled,
                variant_string: item.variant_string,
                variants: product.variants
              }),
              stock: product.stock,
              is_retail_enabled: product.is_retail_enabled,
              is_wholesale_enabled: product.is_wholesale_enabled,
              is_variants_enabled: product.is_variants_enabled,
              retail_price: product.retail_price,
              wholesale_price: product.wholesale_price,
              wholesale_min_qty: product.wholesale_min_qty,
              mrp: product.mrp || product.retail_price,
              variants: product.variants
            })
          }
          
          set({ items: validItems, alerts: newAlerts })
        }
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const actualPrice = (item.price && item.price > 0) ? item.price : item.retail_price
          return total + actualPrice * item.quantity
        }, 0)
      },
    }),
    {
      name: 'hennabyfalina_cart_storage', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), 
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) return { items: [] } 
        return persistedState
      },
    }
  )
)