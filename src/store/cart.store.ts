// src/store/cart.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { broadcast } from '@/lib/broadcast'

export interface CartItem {
  id: string
  product_id: string
  name: string
  slug: string
  price: number
  quantity: number
  image: string
  stock: number
  category_id: string | null
  description?: string | null
  original_price?: number
  selling_price?: number
  rating?: number | null
  review_count?: number | null
  printing_type?: string
  artwork_urls?: string[]
  artwork_sizes?: number[]
  printing_instructions?: string | null
  pricing_tiers?: any[] // 🚨 NEW: Store tiers to calculate delivery days in UI
  version?: number  // 🆕 Optimistic locking version
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  alerts: string[] // 🚨 NEW: Array to hold persistent UI messages
  clearAlerts: () => void
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateItem: (id: string, updates: Partial<Omit<CartItem, 'id'>>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncWithDatabase: (userId: string) => Promise<void>
  _syncAfterUpdate: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  loadCart: () => Promise<void>
  refreshCartPrices: () => Promise<void>
  findCartItem: (productId: string, printingType: string) => CartItem | undefined
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const calculateItemPrice = (
  basePrice: number,
  tiers: any[] | undefined,
  printingType: string
) => {
  if (!tiers || tiers.length === 0) return basePrice
  // 🔒 Ignore soft-deleted or inactive tiers when calculating live cart totals
  const selectedTier = tiers.find(t => t.tier_name === printingType && !t.is_deleted && t.is_active)
  return selectedTier?.selling_price ?? basePrice
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

      findCartItem: (productId, printingType) => {
        return get().items.find(
          (item) => item.product_id === productId && 
                    (item.printing_type || 'None') === (printingType || 'None')
        )
      },

      _syncAfterUpdate: async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await get().syncWithDatabase(session.user.id)
        }
      },

      addItem: async (newItem) => {
        set({ isLoading: true })
        const currentItems = get().items
        const isCustomPrint = (newItem.printing_type || '').includes('Color')

        const existingItem = currentItems.find((item) => {
          const isSameProduct = item.product_id === newItem.product_id
          const isSamePrintType = (item.printing_type || 'None') === (newItem.printing_type || 'None')
          if (!isSameProduct || !isSamePrintType) return false
          
          if (isCustomPrint) {
            const sameInstructions = (item.printing_instructions || null) === (newItem.printing_instructions || null)
            const aUrls = item.artwork_urls || []
            const bUrls = newItem.artwork_urls || []
            const sameUrls = aUrls.length === bUrls.length && aUrls.every((val, index) => val === bUrls[index])
            return sameInstructions && sameUrls
          }
          return true
        })

        let updatedItems: CartItem[]

        if (existingItem) {
          const newQuantity = existingItem.quantity + newItem.quantity
          if (newQuantity > newItem.stock) {
            set({ isLoading: false })
            throw new Error(`Only ${newItem.stock} items available`)
          }
          const basePrice = existingItem.selling_price ?? existingItem.original_price ?? existingItem.price
          updatedItems = currentItems.map((item) =>
            item.id === existingItem.id
              ? incrementVersion({ 
                  ...item, 
                  quantity: newQuantity,
                  price: calculateItemPrice(basePrice, item.pricing_tiers, item.printing_type || 'None') 
                })
              : item
          )
        } else {
          const basePrice = newItem.selling_price ?? newItem.original_price ?? newItem.price
          const cartItem: CartItem = {
            ...newItem,
            id: generateId(),
            version: 1, // Start at 1
            price: calculateItemPrice(basePrice, newItem.pricing_tiers, newItem.printing_type || 'None'),
            category_id: newItem.category_id || null,
            description: newItem.description || null,
            original_price: newItem.original_price,
            rating: newItem.rating || null,
            review_count: newItem.review_count || null,
            selling_price: newItem.selling_price,
            printing_type: newItem.printing_type || 'None',
            artwork_urls: newItem.artwork_urls || [],
            artwork_sizes: newItem.artwork_sizes || [],
            printing_instructions: newItem.printing_instructions || null,
            pricing_tiers: newItem.pricing_tiers || []
          }
          updatedItems = [...currentItems, cartItem]
        }

        set({ items: updatedItems, isLoading: false })
        broadcast.send({ type: 'CART_ITEM_ADDED', productId: newItem.product_id })
        await get()._syncAfterUpdate()
      },

      updateItem: async (id, updates) => {
  set({ isLoading: true })
  const currentItems = get().items
  const itemIndex = currentItems.findIndex(i => i.id === id)

  if (itemIndex === -1) {
    set({ isLoading: false })
    throw new Error('Item not found')
  }

  const oldItem = currentItems[itemIndex]
  const merged = { ...oldItem, ...updates }
  
  // Recalculate price if printing_type or tiers changed
  const basePrice = merged.selling_price ?? merged.original_price ?? merged.price
  const newPrice = calculateItemPrice(basePrice, merged.pricing_tiers, merged.printing_type || 'None')
  
  const updatedItems = [...currentItems]
  updatedItems[itemIndex] = incrementVersion({
    ...merged,
    price: newPrice,
  })

  set({ items: updatedItems, isLoading: false })
  broadcast.send({ type: 'CART_ITEM_UPDATED', productId: oldItem.product_id, printingType: merged.printing_type || 'None' })
  await get()._syncAfterUpdate()
},

      removeItem: async (id: string) => {
        set({ isLoading: true })
        const itemToRemove = get().items.find(i => i.id === id)
        const updatedItems = get().items.filter((item) => item.id !== id)
        set({ items: updatedItems, isLoading: false })
        if (itemToRemove) {
          broadcast.send({ type: 'CART_ITEM_DELETED', productId: itemToRemove.product_id, artworkUrls: itemToRemove.artwork_urls || [] })
        }
        await get()._syncAfterUpdate()
      },

      updateQuantity: async (id: string, quantity: number) => {
        set({ isLoading: true })
        if (quantity <= 0) {
          await get().removeItem(id)
          return
        }

        const item = get().items.find((i) => i.id === id)
        if (item && quantity > item.stock) {
          set({ isLoading: false })
          throw new Error(`Only ${item.stock} items available`)
        }

        const updatedItems = get().items.map((item) => {
          if (item.id === id) {
            const basePrice = item.selling_price ?? item.original_price ?? item.price
            return incrementVersion({
              ...item,
              quantity,
              price: calculateItemPrice(basePrice, item.pricing_tiers, item.printing_type || 'None')
            })
          }
          return item
        })
        
        set({ items: updatedItems, isLoading: false })
        if (item) {
          broadcast.send({ type: 'CART_ITEM_UPDATED', productId: item.product_id, printingType: item.printing_type || 'None' })
        }
        await get()._syncAfterUpdate()
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
        await supabase.from('cart_items').delete().eq('user_id', userId)

        if (localItems.length > 0) {
          const cartItemsToInsert = localItems.map((item) => ({
            user_id: userId,
            product_id: item.product_id,
            quantity: item.quantity,
            printing_type: item.printing_type || 'None',
            artwork_urls: item.artwork_urls || [],
            artwork_sizes: item.artwork_sizes || [],
            printing_instructions: item.printing_instructions || null,
          }))
          await supabase.from('cart_items').insert(cartItemsToInsert)
        }
      },

      loadCart: async () => {
        set({ isLoading: true })
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // 🚨 FETCH TIERS HERE TO POWER THE UI
          const { data: dbItems, error } = await supabase
            .from('cart_items')
            .select('*, products(*, pricing_tiers:product_pricing_tiers(*))')
            .eq('user_id', session.user.id)
          
          if (!error && dbItems && dbItems.length > 0) {
            const loadedItems: CartItem[] = dbItems.filter((item) => item.products !== null).map((item) => {
                const basePrice = item.products.selling_price ?? item.products.price
                return {
                  id: item.id,
                  product_id: item.product_id,
                  name: item.products.name,
                  slug: item.products.slug,
                  price: calculateItemPrice(basePrice, item.products.pricing_tiers, item.printing_type || 'None'),
                  quantity: item.quantity,
                  image: item.products.images?.[0] || '',
                  stock: item.products.stock,
                  category_id: item.products.category_id,
                  description: item.products.description,
                  original_price: item.products.price,
                  rating: item.products.rating,
                  review_count: item.products.review_count,
                  selling_price: item.products.selling_price,
                  printing_type: item.printing_type || 'None',
                  artwork_urls: item.artwork_urls || [],
                  artwork_sizes: item.artwork_sizes || [],
                  printing_instructions: item.printing_instructions || null,
                  pricing_tiers: item.products.pricing_tiers || []
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
        
        // 🚨 REFRESH WITH TIERS
        const { data: products, error } = await supabase
          .from('products')
          .select('id, name, price, selling_price, stock, is_deleted, is_active, pricing_tiers:product_pricing_tiers(*)')
          .in('id', productIds)

        if (!error && products) {
          const newAlerts: string[] = []
          const validItems: CartItem[] = []

          for (const item of currentItems) {
            const product = products.find((p) => p.id === item.product_id)
            
            // 1. PRODUCT DELETION SHIELD
            if (!product || product.is_deleted || !product.is_active) {
              newAlerts.push(`"${item.name}" is no longer available and has been safely removed from your cart.`)
              continue // Discard from validItems array
            }

            // 2. TIER DELETION SHIELD
            let currentTier = item.printing_type
            const selectedTier = product.pricing_tiers?.find((t: any) => t.tier_name === item.printing_type && !t.is_deleted && t.is_active)
            if (item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && !selectedTier) {
              newAlerts.push(`The customization option "${item.printing_type}" for "${item.name}" is no longer available. It has been reverted to standard retail.`)
              currentTier = 'Retail (Readymade)'
            }

            // 3. PRICE DRIFT SHIELD
            const basePrice = product.selling_price ?? product.price
            const newPrice = calculateItemPrice(basePrice, product.pricing_tiers, currentTier || 'None')
            
            if (item.price !== newPrice && item.price !== 0) {
              newAlerts.push(`The price of "${item.name}" has changed from ₹${item.price} to ₹${newPrice}.`)
            }

            validItems.push({
              ...item,
              price: newPrice,
              printing_type: currentTier,
              stock: product.stock,
              selling_price: product.selling_price,
              pricing_tiers: product.pricing_tiers || []
            })
          }
          
          set({ items: validItems, alerts: newAlerts })
        }
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'razack-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Alerts aren't persisted, only shown on session load
      version: 1,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as { items?: any[] }
        if (state?.items) {
          state.items = state.items.map((item: any) => ({
            ...item,
            artwork_urls: item.artwork_urls ?? [],
            artwork_sizes: item.artwork_sizes ?? [],
            printing_instructions: item.printing_instructions ?? null,
            version: item.version ?? 1,
            printing_type: item.printing_type ?? 'None',
          }))
        }
        return state
      },
    }
  )
)