// src/config/navigation.ts

import { 
  Sparkles, Leaf, ShoppingBag, Layers, 
  Paintbrush, Scissors, Heart, FileText, MessageCircle,
  Palette, Phone,
  Package,
  Lock, CircleQuestionMark
} from 'lucide-react'

import { siteConfig } from './site'

export const EXPLORE_LINKS = [
  { 
    href: '/wishlist', 
    label: 'My Wishlist', 
    icon: Heart 
  },
  { 
    href: '/collections', 
    label: 'Shop Collections', 
    icon: Leaf 
  },
  { 
    href: '/services', 
    label: 'Henna Artist Services', 
    icon: Palette
  },
  { 
    href: '/about', 
    label: 'About Henna Artist', 
    icon: Sparkles
  },
  { 
    href: `https://wa.me/${siteConfig.contact.phone.primary.replace(/[^0-9]/g, '')}`, 
    label: 'Chat with Henna Studio', 
    icon: MessageCircle 
  },
  { 
    href: '/contact-support', 
    label: 'Studio Support & Inquiries', 
    icon: Phone 
  },
    { 
    href: '/returns-refunds', 
    label: 'Returns & Refunds', 
    icon: Package
  },
  { 
    href: '/terms-conditions', 
    label: 'Terms of Sale & Privacy', 
    icon: FileText 
  },
    { 
    href: '/privacy-policy', 
    label: 'Privacy Policy', 
    icon: Lock 
  },
  { 
    href: '/faq', 
    label: 'Frequently Asked Questions', 
    icon: CircleQuestionMark
  },

]

export const CATEGORIES_LIST = [
  { 
    id: 'all', 
    href: '/products', 
    label: 'All Collection', 
    icon: Layers 
  },
  { 
    id: 'henna-cones', 
    href: '/products?category=henna-cones', 
    label: 'Henna Cones & Dips', 
    icon: Leaf 
  }, 
  { 
    id: 'combos', 
    href: '/products?category=combo-packs', 
    label: 'Signature Combos', 
    icon: ShoppingBag 
  }, 
  { 
    id: 'stencils', 
    href: '/products?category=stencils', 
    label: 'Bridal Stencils', 
    icon: Scissors 
  }, 
  { 
    id: 'kits', 
    href: '/products?category=kits', 
    label: 'Artist & Starter Kits', 
    icon: Sparkles 
  }, 
  { 
    id: 'essentials-raw', 
    href: '/products?category=raw-materials-essentials', 
    label: 'Powder, Oils & Essentials', 
    icon: Paintbrush 
  }, 
]