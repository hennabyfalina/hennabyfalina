// src/lib/constants.ts

// B2B Packaging Economics: 
// Packaging is bulky. Free shipping threshold must protect profit margins.
export const SHIPPING_THRESHOLD = 2000 
export const SHIPPING_COST = 150

export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  // 🚨 ADDED STORE PICKUP LIFECYCLE 🚨
  READY_FOR_PICKUP: 'ready_for_pickup',
  PICKED_UP: 'picked_up',
  CANCELLED: 'cancelled',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

// Admin Dashboard Constants

export const ORDER_STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  // 🚨 ADDED STORE PICKUP FILTERS 🚨
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'cancel_requested', label: 'Cancel Requested' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'return_requested', label: 'Return Requested' },
  { value: 'returned', label: 'Returned' },
]

export const PAYMENT_METHOD_FILTERS = [
  { value: 'all', label: 'All Payment Methods' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Netbanking' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'emi', label: 'EMI' },
]

export const PRODUCT_STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

export const PRODUCT_SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'newest', label: 'Newly Added' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
]

export const CATEGORY_SORT_OPTIONS = [
  { value: 'display_order', label: 'Custom Order (Drag & Drop)' },
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
]

export const CUSTOMER_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'spent_desc', label: 'Highest Spent' },
  { value: 'orders_desc', label: 'Most Orders' },
  { value: 'name_asc', label: 'Name (A-Z)' },
]

export const INVENTORY_STATUS_FILTERS = [
  { value: 'all', label: 'All Inventory' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

export const INVENTORY_SORT_OPTIONS = [
  { value: 'stock_asc', label: 'Stock Level (Low to High)' },
  { value: 'stock_desc', label: 'Stock Level (High to Low)' },
  { value: 'name_asc', label: 'Product Name (A-Z)' },
  { value: 'name_desc', label: 'Product Name (Z-A)' },
  { value: 'updated_desc', label: 'Recently Updated' },
]

export const FINANCE_TRANSACTION_TYPES = [
  { value: 'all', label: 'All Transactions' },
  { value: 'credit', label: 'Settlements (Credit)' },
  { value: 'debit', label: 'Refunds (Debit)' },
]

export const FINANCE_SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Highest Amount' },
  { value: 'amount_asc', label: 'Lowest Amount' },
]