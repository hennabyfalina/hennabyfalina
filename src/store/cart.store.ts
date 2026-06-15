// src/store/cart.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { broadcast } from '@/lib/broadcast'
import { parseVariants } from '@/lib/pricing'

export interface CartItem {
  mrp: number
  id: string
  product_id: string
  name: string
  slug: string
  price: number // Dynamically calculated active price (Retail or Wholesale)
  quantity: number
  image: string
  stock: number
  category_id: string | null
  description?: string | null
  variant_string?: string | null // 🎨 Support for size/color variants
  bundle_title?: string | null   // 🎁 Support for bundle choices
  
  //  Hybrid Retail/Wholesale variables mapped directly from the Product table
  retail_price: number
  wholesale_price: number
  wholesale_min_qty: number
  
  rating?: number | null
  review_count?: number | null
  version?: number  // Optimistic locking version
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  alerts: string[] // Persistent UI messages
  clearAlerts: () => void
  addItem: (item: Omit<CartItem, 'id' | 'price' | 'version'>) => Promise<void>
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

// 🎯 NEW DYNAMIC PRICING ENGINE
// Automatically switches to wholesale price if quantity hits the threshold
const calculateActivePrice = (quantity: number, retailPrice: number, wholesalePrice: number, wholesaleMinQty: number) => {
  if (wholesalePrice && wholesalePrice > 0 && quantity >= wholesaleMinQty) {
    return wholesalePrice
  }
  return retailPrice
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

      // 🧼 Cleaned finder: Now safely matches products and optional variants
      findCartItem: (productId, variantString) => {
        return get().items.find((item) => item.product_id === productId && (item.variant_string || null) === (variantString || null))
      },

      addItem: async (newItem) => {
        let finalQuantity = newItem.quantity

        set((state) => {
          const currentItems = state.items
          // 🎯 EXACT MATCH: Prevents variants of the same product from merging into one!
          const existingItem = currentItems.find((item) => 
            item.product_id === newItem.product_id && 
            (item.variant_string || null) === (newItem.variant_string || null)
          )
          let updatedItems: CartItem[]

          if (existingItem) {
            const newQuantity = existingItem.quantity + newItem.quantity
            finalQuantity = newQuantity
            if (newQuantity > newItem.stock) {
              throw new Error(`Only ${newItem.stock} items available`)
            }
            
            updatedItems = currentItems.map((item) =>
              item.id === existingItem.id
                ? incrementVersion({ 
                    ...item, 
                    quantity: newQuantity,
                    price: calculateActivePrice(newQuantity, item.retail_price, item.wholesale_price, item.wholesale_min_qty) 
                  })
                : item
            )
          } else {
            const cartItem: CartItem = {
              ...newItem,
              id: generateId(),
              version: 1,
              price: calculateActivePrice(newItem.quantity, newItem.retail_price, newItem.wholesale_price, newItem.wholesale_min_qty),
            }
            updatedItems = [...currentItems, cartItem]
          }

          return { items: updatedItems, isLoading: false }
        })
        
        broadcast.send({ type: 'CART_ITEM_ADDED', productId: newItem.product_id })

        // 🚀 DIRECT DB SYNC (If Logged In)
        const supabase = createClient()
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
        if (sessionErr) console.error('Cart DB Session Error:', sessionErr)

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

          const { data: existing, error: selectErr } = await query.maybeSingle()
            
          if (selectErr) console.error('Cart DB Select Error:', selectErr)
            
          if (existing) {
            const { error } = await supabase.from('cart_items').update({ quantity: finalQuantity }).eq('id', existing.id)
            if (error) console.error('Cart DB Update Error:', error)
          } else {
            const { error } = await supabase.from('cart_items').insert({ 
              user_id: session.user.id, 
              product_id: newItem.product_id, 
              quantity: finalQuantity,
              variant_string: newItem.variant_string || null
            })
            if (error) {
              if (error.code === '23505') {
                console.warn('⚠️ Unique constraint hit! Healing legacy cart item to new variant...')
                await supabase.from('cart_items').update({ 
                  quantity: finalQuantity,
                  variant_string: newItem.variant_string || null
                }).eq('user_id', session.user.id).eq('product_id', newItem.product_id)
              } else {
                console.error('Cart DB Insert Error:', error.message || error, error.code, error.details)
              }
            }
          }
        } else {
          console.log('🛒 Guest user detected: Item saved securely to Local Browser Storage instead of Database.')
        }
      },

      updateItem: async (id, updates) => {
        let targetProductId: string | null = null
        let targetVariantString: string | null = null
        let newQuantity: number | null = null

        set((state) => {
          const currentItems = state.items
          const itemIndex = currentItems.findIndex(i => i.id === id)

          if (itemIndex === -1) {
            throw new Error('Item not found')
          }

          const oldItem = currentItems[itemIndex]
          targetProductId = oldItem.product_id
          targetVariantString = oldItem.variant_string || null
          const merged = { ...oldItem, ...updates }
          newQuantity = merged.quantity
          
          const newPrice = calculateActivePrice(merged.quantity, merged.retail_price, merged.wholesale_price, merged.wholesale_min_qty)
          
          const updatedItems = [...currentItems]
          updatedItems[itemIndex] = incrementVersion({
            ...merged,
            price: newPrice,
          })

          return { items: updatedItems, isLoading: false }
        })

        if (targetProductId) {
          broadcast.send({ type: 'CART_ITEM_UPDATED', productId: targetProductId })
          
          if (newQuantity !== null) {
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
                
              const { error } = await query
              if (error) console.error('Cart DB Update Error:', error)
            }
          }
        } else {
           console.log('🛒 Guest user detected: Update saved securely to Local Browser Storage.')
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
          
          const updatedItems = state.items.filter((item) => item.id !== id)
          return { items: updatedItems, isLoading: false }
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
             
             const { error } = await query
             if (error) console.error('Cart DB Delete Error:', error.message || error, error.code)
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
            throw new Error(`Only ${item.stock} items available`)
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
                price: calculateActivePrice(quantity, item.retail_price, item.wholesale_price, item.wholesale_min_qty)
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
             
             const { error } = await query
             if (error) console.error('Cart DB Update Qty Error:', error.message || error, error.code)
          }
        }
      },

      clearCart: async () => {
        set({ isLoading: true, items: [] })
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { error } = await supabase.from('cart_items').delete().eq('user_id', session.user.id)
          if (error) console.error('Cart DB Clear Error:', error.message || error, error.code)
        }
        set({ isLoading: false })
      },

      syncWithDatabase: async (userId: string) => {
        const supabase = createClient()
        const localItems = get().items

        if (localItems.length > 0) {
           // ⚡ Smart merge local items into db items seamlessly on login
           const { data: dbItems, error: selectErr } = await supabase.from('cart_items').select('product_id, quantity, variant_string').eq('user_id', userId)
           if (selectErr) console.error('Sync DB Select Error:', selectErr.message || selectErr, selectErr.code)

           const dbMap = new Map((dbItems || []).map(i => [`${i.product_id}|${i.variant_string || ''}`, i.quantity]))
           
           for (const item of localItems) {
             const key = `${item.product_id}|${item.variant_string || ''}`
             if (dbMap.has(key)) {
               const dbQty = dbMap.get(key)!
               const mergedQty = Math.max(dbQty, item.quantity)
               let query = supabase.from('cart_items').update({ quantity: mergedQty }).eq('user_id', userId).eq('product_id', item.product_id)
               
               if (item.variant_string) {
                 query = query.eq('variant_string', item.variant_string)
               } else {
                 query = query.is('variant_string', null)
               }
               
               const { error } = await query
               if (error) console.error('Sync DB Update Error:', error.message || error, error.code)
             } else {
               const { error } = await supabase.from('cart_items').insert({ 
                 user_id: userId, 
                 product_id: item.product_id, 
                 quantity: item.quantity,
                 variant_string: item.variant_string || null
               })
               if (error) {
                 if (error.code === '23505') {
                   await supabase.from('cart_items').update({ 
                     quantity: item.quantity,
                     variant_string: item.variant_string || null
                   }).eq('user_id', userId).eq('product_id', item.product_id)
                 } else {
                   console.error('Sync DB Insert Error:', error.message || error, error.code, error.details)
                 }
               }
             }
           }
           await get().loadCart() // Reload db truths into local state
        }
      },

      loadCart: async () => {
        set({ isLoading: true })
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: dbItems, error } = await supabase
            .from('cart_items')
            .select('*, products(*)') // 🧼 Clean fetch: No joins to pricing tiers
            .eq('user_id', session.user.id)
          
          if (error) console.error('Load Cart DB Error:', error.message || error, error.code)

          if (!error && dbItems && dbItems.length > 0) {
            const loadedItems: CartItem[] = dbItems.filter((item) => item.products !== null).map((item) => {
                const prod = item.products
                
                let activeRetailPrice = prod.retail_price;
                let activeMrp = prod.mrp || 0;
                let activeWholesalePrice = prod.wholesale_price;
                let activeWholesaleMinQty = prod.wholesale_min_qty;
                
                if (item.variant_string && prod.variants) {
                  const parsedVariants = parseVariants(prod.variants);
                  const matchedVariant = parsedVariants.find((v: any) => v.name === item.variant_string);
                  if (matchedVariant) {
                    activeRetailPrice = matchedVariant.price;
                    if (matchedVariant.variant_mrp) activeMrp = matchedVariant.variant_mrp;
                    if (matchedVariant.wholesale_price) activeWholesalePrice = matchedVariant.wholesale_price;
                    if (matchedVariant.wholesale_min_qty) activeWholesaleMinQty = matchedVariant.wholesale_min_qty;
                  }
                }
                
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
                  retail_price: activeRetailPrice,
                  wholesale_price: activeWholesalePrice,
                  wholesale_min_qty: activeWholesaleMinQty,
                  mrp: activeMrp,
                  rating: prod.rating,
                  review_count: prod.review_count,
                  variant_string: item.variant_string || null,
                  // 🎯 Price calculated dynamically on load
                  price: calculateActivePrice(item.quantity, activeRetailPrice, activeWholesalePrice, activeWholesaleMinQty)
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
          .select('id, name, retail_price, wholesale_price, wholesale_min_qty, mrp, stock, is_deleted, is_active, variants')
          .in('id', productIds)

        if (error) {
          console.error('Refresh Prices DB Error:', error.message || error, error.code)
          return // DO NOT wipe the cart if the DB query randomly fails!
        }

        if (!error && products) {
          const newAlerts: string[] = []
          const validItems: CartItem[] = []

          for (const item of currentItems) {
            const product = products.find((p) => p.id === item.product_id)
            
            // 1. PRODUCT DELETION SHIELD 
            if (!product) {
              console.warn(`Product ${item.product_id} not found during refresh. Assuming RLS filter. Skipping wipe.`)
              validItems.push(item)
              continue
            }
            
            if (product.is_deleted || !product.is_active) {
              newAlerts.push(`"${item.name}" is no longer available and has been safely removed from your cart.`)
              continue
            }
            
            let activeRetailPrice = product.retail_price;
            let activeMrp = product.mrp || 0;
            let activeWholesalePrice = product.wholesale_price;
            let activeWholesaleMinQty = product.wholesale_min_qty;
            
            if (item.variant_string && product.variants) {
              const parsedVariants = parseVariants(product.variants);
              const matchedVariant = parsedVariants.find((v: any) => v.name === item.variant_string);
              if (matchedVariant) {
                activeRetailPrice = matchedVariant.price;
                if (matchedVariant.variant_mrp) activeMrp = matchedVariant.variant_mrp;
                if (matchedVariant.wholesale_price) activeWholesalePrice = matchedVariant.wholesale_price;
                if (matchedVariant.wholesale_min_qty) activeWholesaleMinQty = matchedVariant.wholesale_min_qty;
              }
            }

            // 2. PRICE DRIFT SHIELD
            const newPrice = calculateActivePrice(item.quantity, activeRetailPrice, activeWholesalePrice, activeWholesaleMinQty)
            
            if (item.price !== newPrice && item.price !== 0) {
              newAlerts.push(`The price of "${item.name}" has changed to ₹${newPrice}.`)
            }

            validItems.push({
              ...item,
              price: newPrice,
              stock: product.stock,
              retail_price: activeRetailPrice,
              wholesale_price: activeWholesalePrice,
              wholesale_min_qty: activeWholesaleMinQty,
              mrp: activeMrp
            })
          }
          
          set({ items: validItems, alerts: newAlerts })
        }
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          // 🧠 Fallback to retail_price if price is 0 or invalid
          const actualPrice = (item.price && item.price > 0)
            ? item.price
            : item.retail_price;
          return total + actualPrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'hennabyfalina_cart_storage', // 🆕 Isolated unique storage key for Cart
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), 
      version: 3, // 🆕 Incremented version to bust any old cached packaging data
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          // If a user visits with old cache data, nuke it entirely to prevent layout crashes
          return { items: [] }
        }
        return persistedState
      },
    }
  )
)