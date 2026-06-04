'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/StatsCard'
import StockUpdateModal from '@/components/admin/StockUpdateModal' 
import { showToast } from '@/components/ui/Toast'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCompactIndianCurrency } from '@/lib/utils'
import { Boxes, AlertTriangle, XCircle, TrendingUp, Search, Filter, Edit, Image as ImageIcon, History, RefreshCcw } from 'lucide-react'

import { INVENTORY_STATUS_FILTERS, INVENTORY_SORT_OPTIONS } from '@/lib/constants'
import { restoreProduct } from '@/services/product.service'
import AdminInventoryLoading from './loading'

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  stock: number
  price: number
  selling_price?: number 
  images: string[]
  updated_at: string
  is_deleted: boolean
  category?: { name: string } | null
}

const LOW_STOCK_THRESHOLD = 10

const UPDATED_STATUS_FILTERS = [
  ...INVENTORY_STATUS_FILTERS,
  { value: 'archived', label: 'Archived Items' }
]

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('stock_asc')

  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)

  const supabase = createClient()

  const loadInventory = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, sku, stock, price, selling_price, images, updated_at, is_deleted,
          category:categories(name)
        `)

      if (statusFilter === 'archived') {
        query = query.eq('is_deleted', true)
      } else {
        query = query.eq('is_deleted', false)
      }

      const { data, error } = await query.order('stock', { ascending: true })

      if (error) throw error
      setInventory(data as any || [])
    } catch (error) {
      showToast('Failed to load inventory data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [statusFilter]) 

  useEffect(() => {
    const urls = new Map<string, string>()
    for (const item of inventory) {
      if (item.images && item.images.length > 0) {
        urls.set(item.id, getPublicUrl(item.images[0]))
      }
    }
    setImageUrls(urls)
  }, [inventory])

  const handleRestore = async (id: string) => {
    try {
      await restoreProduct(id)
      showToast('Product restored to catalog', 'success')
      loadInventory()
    } catch (err) {
      showToast('Restoration failed', 'error')
    }
  }

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

  const activeItems = inventory.filter(i => !i.is_deleted)
  const totalValue = activeItems.reduce((sum, item) => sum + ((item.selling_price || item.price) * item.stock), 0)
  const lowStockCount = activeItems.filter(i => i.stock > 0 && i.stock <= LOW_STOCK_THRESHOLD).length
  const outOfStockCount = activeItems.filter(i => i.stock === 0).length

// Show skeleton if loading and no inventory yet (initial load)
if (isLoading && inventory.length === 0) {
  return <AdminInventoryLoading />;
}

  return (
    <>
      <div className="flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium admin-text-primary tracking-tight leading-tight">Inventory</h1>
            <p className="text-sm admin-text-secondary mt-1">Audit stock levels, update quantities, and track assets.</p>
          </div>
          
          <Link 
            href="/admin/inventory/logs"
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold admin-bg-card admin-text-accent border admin-border hover:border-[#A8C7FA] rounded-full hover:admin-bg-elevated transition-colors shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" /> View Audit Logs
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total SKUs" value={activeItems.length} icon={<Boxes className="w-5 h-5 admin-text-accent" />} />
          <StatsCard title="Low Stock Alert" value={lowStockCount} icon={<AlertTriangle className="w-5 h-5 admin-text-accent" />} />
          <StatsCard title="Out of Stock" value={outOfStockCount} icon={<XCircle className="w-5 h-5 text-red-400" />} />
          <StatsCard title="Est. Asset Value" value={formatCompactIndianCurrency(totalValue).replace(/\.00$/, '')} icon={<TrendingUp className="w-5 h-5 admin-text-accent" />} />
        </div>

        <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted group-focus-within:admin-text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              title="Search product name or SKU"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 admin-bg-primary border border-transparent admin-text-primary placeholder:admin-text-muted rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 admin-text-muted hover:admin-text-primary">✕</button>}
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0 min-w-[180px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted" />
              <select
                title="Sort inventory"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {INVENTORY_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="admin-bg-card">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="relative shrink-0 min-w-[150px]">
              <select
                title="Filter by stock status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {UPDATED_STATUS_FILTERS.map(opt => (
                  <option key={opt.value} value={opt.value} className="admin-bg-card">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[900px] text-left">
              <thead className="admin-bg-primary">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest w-16">Item</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Product Details</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Category</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Current Stock</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y admin-border">
                {sortedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Boxes className="w-12 h-12 admin-text-muted mx-auto mb-4" />
                      <p className="admin-text-muted font-medium">No inventory records match your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  sortedInventory.map((item) => {
                    const imageUrl = imageUrls.get(item.id)
                    const isOut = item.stock === 0
                    const isLow = item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD

                    return (
                      <tr key={item.id} className={`hover:admin-bg-elevated transition-colors group ${item.is_deleted ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-5">
                          {imageUrl ? (
                            <div className="w-12 h-12 admin-bg-primary border admin-border rounded-xl overflow-hidden shadow-sm">
                              <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 admin-bg-primary border admin-border rounded-xl flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-[#565959]" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium admin-text-primary group-hover:admin-text-accent transition-colors line-clamp-1">{item.name}</p>
                          <p className="text-xs admin-text-muted font-mono mt-1 tracking-wide">{item.sku || 'NO-SKU'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm admin-text-secondary admin-bg-primary px-3 py-1 rounded-md border admin-border">
                            {item.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2" suppressHydrationWarning>
                            <span className={`text-lg font-medium ${isLow ? 'text-[#F9AB00]' : isOut ? 'text-red-400' : 'admin-text-primary'}`}>
                              {item.stock}
                            </span>
                            <span className="text-[10px] admin-text-muted uppercase tracking-widest mt-1">Units</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {item.is_deleted ? (
                             <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase admin-bg-elevated admin-text-muted border admin-border">Archived</span>
                          ) : isOut ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase admin-badge-cancelled border border-[var(--admin-status-cancelled-text)]/20">Out of Stock</span>
                          ) : isLow ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase admin-badge-pending border border-[var(--admin-status-pending-text)]/20">Low Stock</span>
                          ) : (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase admin-badge-delivered border border-[var(--admin-status-delivered-text)]/20">In Stock</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          {item.is_deleted ? (
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#93D7A4]/10 hover:bg-[#93D7A4]/20 text-[#93D7A4] text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer border border-[#93D7A4]/30"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" /> Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => setAdjustingItem(item)}
                              className="p-2 admin-text-accent hover:bg-[#0B57D0]/20 rounded-full transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
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