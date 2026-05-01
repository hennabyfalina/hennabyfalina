// src/store/cart.store.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

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
  bulk_price?: number | null
  bulk_min_quantity?: number | null
  rating?: number | null
  review_count?: number | null
  selling_price?: number
  printing_type?: string
  // 🚨 UPGRADED TO ARRAY
  artwork_urls?: string[]
  printing_instructions?: string | null
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeItem: (productId: string, printingType?: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number, printingType?: string) => Promise<void>
  clearCart: () => Promise<void>
  syncWithDatabase: (userId: string) => Promise<void>
  _syncAfterUpdate: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  loadCart: () => Promise<void>
  refreshCartPrices: () => Promise<void>
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const calculateItemPrice = (
  basePrice: number,
  bulkPrice?: number | null,
  bulkMinQty?: number | null,
  quantity: number = 1
) => {
  if (bulkPrice && bulkMinQty && quantity >= bulkMinQty) {
    return bulkPrice
  }
  return basePrice
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

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
        
        const existingItem = currentItems.find(
          (item) => item.product_id === newItem.product_id && (item.printing_type || 'None') === (newItem.printing_type || 'None')
        )

        let updatedItems: CartItem[]

        if (existingItem) {
          const newQuantity = existingItem.quantity + newItem.quantity
          if (newQuantity > newItem.stock) {
            set({ isLoading: false })
            throw new Error(`Only ${newItem.stock} items available`)
          }
          const basePrice = existingItem.selling_price ?? existingItem.original_price ?? existingItem.price
          updatedItems = currentItems.map((item) =>
            item.product_id === newItem.product_id && (item.printing_type || 'None') === (newItem.printing_type || 'None')
              ? { ...item, quantity: newQuantity, price: calculateItemPrice(basePrice, item.bulk_price, item.bulk_min_quantity, newQuantity) }
              : item
          )
        } else {
          const basePrice = newItem.selling_price ?? newItem.original_price ?? newItem.price
          const cartItem: CartItem = {
            ...newItem,
            id: generateId(),
            price: calculateItemPrice(basePrice, newItem.bulk_price, newItem.bulk_min_quantity, newItem.quantity),
            category_id: newItem.category_id || null,
            description: newItem.description || null,
            original_price: newItem.original_price,
            bulk_price: newItem.bulk_price || null,
            bulk_min_quantity: newItem.bulk_min_quantity || null,
            rating: newItem.rating || null,
            review_count: newItem.review_count || null,
            selling_price: newItem.selling_price,
            printing_type: newItem.printing_type || 'None',
            // 🚨 UPGRADED TO ARRAY
            artwork_urls: newItem.artwork_urls || [],
            printing_instructions: newItem.printing_instructions || null,
          }
          updatedItems = [...currentItems, cartItem]
        }

        set({ items: updatedItems, isLoading: false })
        await get()._syncAfterUpdate()
      },

      removeItem: async (productId: string, printingType: string = 'None') => {
        set({ isLoading: true })
        const updatedItems = get().items.filter(
          (item) => !(item.product_id === productId && (item.printing_type || 'None') === printingType)
        )
        set({ items: updatedItems, isLoading: false })
        await get()._syncAfterUpdate()
      },

      updateQuantity: async (productId: string, quantity: number, printingType: string = 'None') => {
        set({ isLoading: true })
        if (quantity <= 0) {
          await get().removeItem(productId, printingType)
          return
        }

        const item = get().items.find((i) => i.product_id === productId && (i.printing_type || 'None') === printingType)
        if (item && quantity > item.stock) {
          set({ isLoading: false })
          throw new Error(`Only ${item.stock} items available`)
        }

        const updatedItems = get().items.map((item) => {
          if (item.product_id === productId && (item.printing_type || 'None') === printingType) {
            const basePrice = item.selling_price ?? item.original_price ?? item.price
            return {
              ...item,
              quantity,
              price: calculateItemPrice(basePrice, item.bulk_price, item.bulk_min_quantity, quantity)
            }
          }
          return item
        })
        
        set({ items: updatedItems, isLoading: false })
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
            // 🚨 UPGRADED TO ARRAY
            artwork_urls: item.artwork_urls || [],
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
          const { data: dbItems, error } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', session.user.id)
          if (!error && dbItems && dbItems.length > 0) {
            const loadedItems: CartItem[] = dbItems.filter((item) => item.products !== null).map((item) => {
                const basePrice = item.products.selling_price ?? item.products.price
                return {
                  id: item.id,
                  product_id: item.product_id,
                  name: item.products.name,
                  slug: item.products.slug,
                  price: calculateItemPrice(basePrice, item.products.bulk_price, item.products.bulk_min_quantity, item.quantity),
                  quantity: item.quantity,
                  image: item.products.images?.[0] || '',
                  stock: item.products.stock,
                  category_id: item.products.category_id,
                  description: item.products.description,
                  original_price: item.products.price,
                  bulk_price: item.products.bulk_price,
                  bulk_min_quantity: item.products.bulk_min_quantity,
                  rating: item.products.rating,
                  review_count: item.products.review_count,
                  selling_price: item.products.selling_price,
                  printing_type: item.printing_type || 'None',
                  // 🚨 UPGRADED TO ARRAY
                  artwork_urls: item.artwork_urls || [],
                  printing_instructions: item.printing_instructions || null,
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
        const { data: products, error } = await supabase.from('products').select('id, name, slug, price, selling_price, bulk_price, bulk_min_quantity, stock, images, category_id, description, rating, review_count').in('id', productIds)

        if (!error && products) {
          const updatedItems = currentItems.map((item) => {
            const product = products.find((p) => p.id === item.product_id)
            if (!product) return item
            const basePrice = product.selling_price ?? product.price
            return {
              ...item,
              price: calculateItemPrice(basePrice, product.bulk_price, product.bulk_min_quantity, item.quantity),
              stock: product.stock,
              bulk_price: product.bulk_price,
              bulk_min_quantity: product.bulk_min_quantity,
              selling_price: product.selling_price,
            }
          })
          set({ items: updatedItems })
        }
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'razack-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)