// src/app/admin/inventory/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/StatsCard'
import AdminLoader from '@/components/admin/AdminLoader'
import StockUpdateModal from '@/components/admin/StockUpdateModal' // 🚨 PROPER MODAL IMPORT
import { showToast } from '@/components/ui/Toast'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency, formatCompactIndianCurrency } from '@/lib/utils'
import { Boxes, AlertTriangle, XCircle, TrendingUp, Search, Filter, Edit, Image as ImageIcon, History } from 'lucide-react'

// 🚨 IMPORTED DRY CONSTANTS 🚨
import { INVENTORY_STATUS_FILTERS, INVENTORY_SORT_OPTIONS } from '@/lib/constants'

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  stock: number
  price: number
  selling_price?: number // Needed for the modal
  bulk_price?: number | null // Needed for the modal
  images: string[]
  updated_at: string
  category?: { name: string } | null
}

const LOW_STOCK_THRESHOLD = 10

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('stock_asc')

  // Stock Adjustment State
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadInventory()
  }, [])

  useEffect(() => {
    const urls = new Map<string, string>()
    for (const item of inventory) {
      if (item.images && item.images.length > 0) {
        urls.set(item.id, getPublicUrl(item.images[0]))
      }
    }
    setImageUrls(urls)
  }, [inventory])

  const loadInventory = async () => {
    setIsLoading(true)
    try {
      // 🚨 Added selling_price and bulk_price for the StockUpdateModal context
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, sku, stock, price, selling_price, bulk_price, images, updated_at,
          category:categories(name)
        `)
        .order('stock', { ascending: true })

      if (error) throw error
      setInventory(data as any || [])
    } catch (error) {
      showToast('Failed to load inventory data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter & Sort Logic
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'in_stock') matchesStatus = item.stock > LOW_STOCK_THRESHOLD
    if (statusFilter === 'low_stock') matchesStatus = item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD
    if (statusFilter === 'out_of_stock') matchesStatus = item.stock === 0

    return matchesSearch && matchesStatus
  })

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortBy === 'stock_asc') return a.stock - b.stock
    if (sortBy === 'stock_desc') return b.stock - a.stock
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    if (sortBy === 'updated_desc') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    return 0
  })

  // Metrics
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.stock), 0)
  const lowStockCount = inventory.filter(i => i.stock > 0 && i.stock <= LOW_STOCK_THRESHOLD).length
  const outOfStockCount = inventory.filter(i => i.stock === 0).length

  if (isLoading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Auditing inventory records..." />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* 🚨 HEADER WITH LOGS BUTTON 🚨 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight leading-tight">Inventory</h1>
            <p className="text-sm text-[#C4C7C5] mt-1">Audit stock levels, update quantities, and track assets.</p>
          </div>
          
          <Link 
            href="/admin/inventory/logs"
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-[#1E1F20] text-[#A8C7FA] border border-[#333538] hover:border-[#A8C7FA] rounded-full hover:bg-[#282A2C] transition-colors shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" /> View Audit Logs
          </Link>
        </div>

        {/* 🚨 STATS GRID 🚨 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total SKUs" value={inventory.length} icon={<Boxes className="w-5 h-5 text-[#A8C7FA]" />} />
          <StatsCard title="Low Stock Alert" value={lowStockCount} icon={<AlertTriangle className="w-5 h-5 text-[#A8C7FA]" />} />
          <StatsCard title="Out of Stock" value={outOfStockCount} icon={<XCircle className="w-5 h-5 text-red-400" />} />
          <StatsCard title="Est. Asset Value" value={formatCompactIndianCurrency(totalValue).replace(/\.00$/, '')} icon={<TrendingUp className="w-5 h-5 text-[#A8C7FA]" />} />
        </div>

        {/* 🚨 FLOATING SEARCH & FILTERS 🚨 */}
        <div className="flex flex-col md:flex-row gap-3 bg-[#1E1F20] p-3 rounded-[24px] border border-[#333538]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196] group-focus-within:text-[#A8C7FA] transition-colors" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              title="Search product name or SKU"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-[#131314] border border-transparent text-[#E3E3E3] placeholder:text-[#8E9196] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E9196] hover:text-[#E3E3E3]">✕</button>}
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0 min-w-[180px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196]" />
              <select
                title="Sort inventory"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {INVENTORY_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="relative shrink-0 min-w-[150px]">
              <select
                title="Filter by stock status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {INVENTORY_STATUS_FILTERS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 🚨 ELITE DATA TABLE 🚨 */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#131314]">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest w-16">Item</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Product Details</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Category</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Current Stock</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333538]">
                {sortedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Boxes className="w-12 h-12 text-[#333538] mx-auto mb-4" />
                      <p className="text-[#8E9196] font-medium">No inventory records match your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  sortedInventory.map((item) => {
                    const imageUrl = imageUrls.get(item.id)
                    const isOut = item.stock === 0
                    const isLow = item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD

                    return (
                      <tr key={item.id} className="hover:bg-[#282A2C] transition-colors group">
                        <td className="px-6 py-5">
                          {imageUrl ? (
                            <div className="w-12 h-12 bg-[#131314] border border-[#333538] rounded-xl overflow-hidden shadow-sm">
                              <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-[#131314] border border-[#333538] rounded-xl flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-[#565959]" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors line-clamp-1">{item.name}</p>
                          <p className="text-xs text-[#8E9196] font-mono mt-1 tracking-wide">{item.sku || 'NO-SKU'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-[#C4C7C5] bg-[#131314] px-3 py-1 rounded-md border border-[#333538]">
                            {item.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-medium ${isLow ? 'text-[#F9AB00]' : isOut ? 'text-red-400' : 'text-[#E3E3E3]'}`}>
                              {item.stock}
                            </span>
                            <span className="text-[10px] text-[#8E9196] uppercase tracking-widest mt-1">Units</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {isOut ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#4D2628] text-[#F2B8B5] border border-[#8C1D18]">Out of Stock</span>
                          ) : isLow ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#3C1E0A] text-[#F9AB00] border border-[#4E270D]">Low Stock</span>
                          ) : (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#214332]/30 text-[#93D7A4] border border-[#214332]">In Stock</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B57D0]/10 hover:bg-[#0B57D0]/20 text-[#A8C7FA] text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer border border-[#0B57D0]/30"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🚨 PROPER SECURE MODAL INTEGRATION 🚨 */}
      <StockUpdateModal
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        product={adjustingItem}
        onSuccess={() => {
          loadInventory()
          setAdjustingItem(null)
        }}
      />
    </>
  )
}