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
}

export type Category = {
  id: string
  name: string
  slug: string
  image: string | null
  display_order: number
  created_at: string
}