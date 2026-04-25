// src/config/navigation.ts

import { 
  Mail, PenSquare, Building, FileText, MessageCircle, 
  Layers, Box, Gift, Printer, Package, ShieldCheck
} from 'lucide-react'
import { siteConfig } from './site'

export const EXPLORE_LINKS = [
  { href: '/custom-order', label: 'Request Custom Design', icon: PenSquare },
  { href: '/wholesale', label: 'Bulk/Wholesale Inquiry', icon: Building },
  { href: `https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`, label: 'Chat with Expert', icon: MessageCircle },
  { href: '/contact', label: 'Contact Support', icon: Mail },
  { href: '/terms', label: 'Privacy & Terms', icon: FileText },
]

export const CATEGORIES_LIST = [
  { id: 'all', href: '/products', label: 'All Products', icon: Layers },
  { id: 'sweet-cake-boxes', href: '/products?category=sweet-cake-boxes', label: 'Sweet & Cake Boxes', icon: Gift }, 
  { id: 'gift-fancy-boxes', href: '/products?category=gift-fancy-boxes', label: 'Gift & Fancy Boxes', icon: Box }, 
  { id: 'valet-rigid-boxes', href: '/products?category=valet-rigid-boxes', label: 'Valet & Rigid Boxes', icon: ShieldCheck }, 
  { id: 'offset-printing', href: '/products?category=offset-printing', label: 'Printing Services', icon: Printer }, 
  { id: 'packaging-materials', href: '/products?category=packaging-materials', label: 'Packaging Materials', icon: Package }, 
]