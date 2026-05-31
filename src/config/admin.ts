// src/config/admin.ts

import { LayoutDashboard, Package, ShoppingCart, Users, Tags, Boxes, IndianRupee, Settings } from 'lucide-react'

// 1. Centralized Admin Navigation
export const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'super_admin'] },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'super_admin'] },
  { href: '/admin/products', label: 'Products', icon: Package, roles: ['admin', 'super_admin'] },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'super_admin'] },
  { href: '/admin/categories', label: 'Categories', icon: Tags, roles: ['admin', 'super_admin'] },
  { href: '/admin/customers', label: 'Customers', icon: Users, roles: ['admin', 'super_admin'] },
  { href: '/admin/finance', label: 'Finance', icon: IndianRupee, roles: ['admin', 'super_admin'] }, // ✅ Visible to both, but page restricts
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin', 'super_admin'] }, 
]

// 2. Strict Gemini UI Color Dictionary
// Use these constants in your tables and cards to ensure 100% consistency
export const GEMINI_ADMIN_UI = {
  bg: {
    main: 'bg-black',
    card: 'bg-[#1E1F20]',
    hover: 'hover:bg-[#282A2C]',
    active: 'bg-[#282A2C]',
  },
  border: {
    default: 'border-[#333538]',
    focus: 'focus:border-[#A8C7FA]',
  },
  text: {
    primary: 'text-[#E3E3E3]',
    muted: 'text-[#C4C7C5]',
    accent: 'text-[#A8C7FA]', // Gemini Blue Text
    warning: 'text-[#F9AB00]', // AWS/Gemini Orange
  },
  button: {
    primary: 'bg-[#0B57D0] hover:bg-[#0842A0] text-white',
    danger: 'bg-[#3C1E0A] hover:bg-[#4E270D] text-[#F9AB00]',
  }
}