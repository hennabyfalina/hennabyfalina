// src/types/database.types.ts

export type ProductPricingTier = {
  id: string
  product_id: string
  tier_name: string
  mrp: number
  selling_price: number
  min_quantity: number
  requires_artwork: boolean
  delivery_days: number
  is_active: boolean
  is_deleted: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  stock: number
  min_order_qty: number
  images: string[]
  sku: any
  dimensions: any
  weight: any
  weight_unit: 'kg' | 'g' | null
  gsm: any
  is_active: boolean
  is_featured: boolean
  is_deleted?: boolean 
  rating: number
  review_count: number
  meta_title: string
  meta_description: string | null
  frequently_bought_together?: string[] | null
  created_at: string
  updated_at: string
  
  // Array of dynamic pricing rules
  pricing_tiers?: ProductPricingTier[] 

  // Core pricing
  price: number
  selling_price: number | null
}

export type Category = {
  id: string
  name: string
  slug: string
  image: string | null
  display_order: number
  created_at: string
}

// 🚨 ENTERPRISE DRAFT SCHEMA: Added address structures supporting high-resilience states
export type Address = {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  landmark: string | null
  delivery_instructions: string | null
  is_default: boolean
  is_temp: boolean // 🚀 Pure database source of truth state constraint
  created_at: string
  updated_at: string
}

// Order and Order Item Types for B2B
export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  original_price: number | null
  printing_type: string
  artwork_urls: string[] | null
  artwork_sizes: number[] | null
  printing_instructions: string | null
  created_at: string
}

export type Order = {
  id: string
  order_number: string
  user_id: string
  address_id: string
  total_amount: number
  shipping_cost: number
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed'
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}