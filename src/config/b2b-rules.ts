// src/config/b2b-rules.ts

export const B2B_CONSTANTS = {
  RETAIL_MIN_QTY: 100,
  WHOLESALE_MIN_QTY: 1000,
  OFFSET_PRINT_MIN_QTY: 5000,
  STANDARD_DELIVERY_DAYS: 7,
  EXPRESS_DELIVERY_DAYS: 2,
}

export const PRINTING_TIERS = [
  { 
    id: 'Retail (Readymade)', 
    title: 'Retail (Readymade)', 
    minQty: B2B_CONSTANTS.RETAIL_MIN_QTY, 
    days: B2B_CONSTANTS.EXPRESS_DELIVERY_DAYS, 
    desc: 'Standard stock boxes.', 
    tag: '',
    requiresArtwork: false 
  },
  { 
    id: 'Wholesale (No Print)', 
    title: 'Wholesale (No Print)', 
    minQty: B2B_CONSTANTS.WHOLESALE_MIN_QTY, 
    days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS, 
    desc: 'Bulk plain boxes.', 
    tag: 'Best Value',
    requiresArtwork: false 
  },
  { 
    id: 'Wholesale (Single Color)', 
    title: 'Single Color Print', 
    minQty: B2B_CONSTANTS.WHOLESALE_MIN_QTY, 
    days: B2B_CONSTANTS.EXPRESS_DELIVERY_DAYS, 
    desc: 'Fast screen printing.', 
    tag: 'Fastest',
    requiresArtwork: true   // ✅ NOW REQUIRES UPLOAD
  },
  { 
    id: 'Wholesale (Multi Color)', 
    title: 'Multi Color Print', 
    minQty: B2B_CONSTANTS.OFFSET_PRINT_MIN_QTY, 
    days: B2B_CONSTANTS.STANDARD_DELIVERY_DAYS, 
    desc: 'Premium offset branding.', 
    tag: 'Popular',
    requiresArtwork: true 
  }
]