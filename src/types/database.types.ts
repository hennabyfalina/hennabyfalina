// src/types/database.types.ts

export type Product = {
  review_count: number
  rating: number
  selling_price: number
  bulk_min_quantity: number
  meta_title: string
  meta_description: string | null
  sku: any
  dimensions: any
  weight: any
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  bulk_price: number | null
  stock: number
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  category_id: string | null
  frequently_bought_together?: string[] | null;
}

export type Category = {
  id: string
  name: string
  slug: string
  image: string | null
  display_order: number
  created_at: string
}

// Order and Order Item Types for B2B
export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  original_price: number | null
  is_bulk_pricing: boolean
  printing_type: string
  // 🚨 UPGRADED TO ARRAY 🚨
  artwork_urls: string[] | null
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