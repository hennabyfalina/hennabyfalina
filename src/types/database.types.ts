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
  id: string
  category_id: string | null
  name: string
  slug: string
  sku: string | null
  description: string | null
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

  // 🏛️ BIG-TECH STRATEGIC MODES FEATURE FLAGS
  is_retail_enabled: boolean       
  is_wholesale_enabled: boolean    
  is_variants_enabled: boolean    

  // 🎯 HYBRID B2B PRICING CORE 
  retail_price: number       
  wholesale_price: number | null    
  wholesale_min_qty: number | null  
  mrp: number | null            
  weight: number | null
  weight_unit: string | null
  gsm: number | null
  dimensions: { length: number; width: number; height: number } | null
  meta_title: string | null
  meta_description: string | null
  variants: any              
}

export type Category = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image: string | null
  is_active: boolean | null
  is_deleted: boolean | null
  is_featured: boolean | null
  low_stock_threshold: number | null
  display_order: number | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string | null
  type: string | null
}

export type Address = {
  id: string
  user_id: string
  name: string              
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
  delivery_method: string    
  is_temp: boolean           
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number             
  original_price: number    
  created_at: string
  
  // ⚡ FIXED: Synced types schema rules to track snapshotted parameters forever
  variant_string: string | null
  purchase_type: 'retail' | 'wholesale' | 'variant_retail' | 'variant_wholesale'
}

export type Order = {
  id: string
  order_number: string
  user_id: string
  address_id: string | null
  total_amount: number
  shipping_cost: number
  shipping_method: 'delivery' | 'pickup'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'cancel_requested' | 'return_requested'
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