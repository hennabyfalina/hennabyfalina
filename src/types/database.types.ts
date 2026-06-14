// src/types/database.types.ts

export type User = {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  created_at: string
  updated_at: string
}

export type Product = {
  variants: any
  price: number
  id: string
  name: string
  slug: string
  sku: string | null
  description: string | null
  category_id: string | null
  stock: number
  images: string[]
  is_active: boolean
  is_deleted: boolean
  is_featured: boolean
  rating: number
  review_count: number
  frequently_bought_together: string[] | null
  created_at: string
  updated_at: string

  // 🎯 NEW HYBRID B2B PRICING CORE (Replaces legacy packaging tiers)
  retail_price: number       // Standard retail unit price
  wholesale_price: number    // Small wholesale group/dealer price
  wholesale_min_qty: number  // The threshold count where wholesale price triggers
  mrp: number                // Maximum Retail Price
  weight: number | null
  weight_unit: string | null
  gsm: number | null
  dimensions: { length: number; width: number; height: number } | null
  meta_title: string | null
  meta_description: string | null
}

export type Category = {
  id: string
  category_id: string | null
  parent_id: string | null
  name: string
  slug: string
  sku: string | null
  description: string | null
  image: string | null
  retail_price: number
  wholesale_price: number
  wholesale_min_qty: number
  stock: number
  images: string[]
  is_deleted: boolean
  is_featured: boolean
  rating: number
  review_count: number
  frequently_bought_together: string[] | null
  mrp: number
  weight: number | null
  weight_unit: string | null
  gsm: number | null
  dimensions: any | null
  low_stock_threshold: number
  display_order: number
  is_active: boolean
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string | null
}

export type Address = {
  id: string
  user_id: string
  name: string              // Aligned directly with column 'name' from public.addresses
  phone: string
  address_line1: string | null
  address_line2: string | null
  landmark: string | null
  city: string | null
  state: string | null
  pincode: string
  country: string
  delivery_instructions: string | null
  is_default: boolean
  delivery_method: string    // 'delivery' or 'pickup'
  is_temp: boolean           // Pure database source of truth state constraint
  created_at: string
}

// Order and Order Item Types (Cleaned of artwork and printing overhead)
export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number              // Locked capture invoice price (Retail or Wholesale)
  original_price: number     // Original base list price
  created_at: string
}

export type Order = {
  id: string
  order_number: string
  user_id: string
  address_id: string | null
  total_amount: number
  shipping_cost: number
  shipping_method: 'delivery' | 'pickup'
  payment_status: 'pending' | 'paid' | 'failed'
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: string
  payment_method_detail: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  idempotency_key: string | null
  session_id: string | null
  pickup_contact: { name: string; phone: string; pincode: string } | null
  created_at: string
  updated_at: string
}