// src/app/admin/products/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import ProductForm from '@/components/admin/ProductForm'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { Product as BaseProduct } from '@/types/database.types'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Package, CheckCircle, Search, Filter, Trash2, Edit } from 'lucide-react'

import { PRODUCT_STATUS_FILTERS, PRODUCT_SORT_OPTIONS } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { createProduct, updateProduct, deleteProduct } from '@/services/product.service'
import AdminProductsLoading from './loading'


const formatIST = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

type Product = BaseProduct & {
  status?: 'draft' | 'published' | 'archived'
  updated_at?: string
  rating?: number | null
  review_count?: number | null
}

export default function AdminProducts() {
  const { isSuperAdmin } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const supabase = createClient()

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const mappedData = (data || []).map(p => ({
        ...p,
        status: p.is_active ? 'published' : 'draft'
      }))
      setProducts(mappedData)
    } catch (error) {
      showToast('Failed to load products', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('display_order')
      
      if (error) throw error
      setCategories(data || [])
      const map = new Map<string, string>()
      data?.forEach(cat => map.set(cat.id, cat.name))
      setCategoryMap(map)
    } catch (error) {
      console.error('Failed to load categories', error)
    }
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  useEffect(() => {
    const loadImageUrls = () => {
      const urls = new Map<string, string>()
      for (const product of products) {
        if (product.images && product.images.length > 0) {
          const publicUrl = getPublicUrl(product.images[0])
          urls.set(product.id, publicUrl)
        }
      }
      setImageUrls(urls)
    }
    
    if (products.length > 0) {
      loadImageUrls()
    }
  }, [products])

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        showToast('Product updated successfully', 'success')
      } else {
        await createProduct(formData)
        showToast('Product created successfully', 'success')
      }
      
      await loadProducts()
      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (error: any) {
      showToast(error.message || 'Failed to save product', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    setIsSubmitting(true)
    try {
      await deleteProduct(productToDelete.id)
      await loadProducts()
      setProductToDelete(null)
      showToast('Product permanently deleted', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to delete product', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

if (isLoading && products.length === 0) {
  return <AdminProductsLoading />;
}

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = a.retail_price ?? 0
    const bPrice = b.retail_price ?? 0

    if (sortBy === 'updated_desc') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    if (sortBy === 'price_asc') return aPrice - bPrice
    if (sortBy === 'price_desc') return bPrice - aPrice
    return 0
  })

  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'published').length

  return (
    <>
      <div className="flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium admin-text-primary tracking-tight leading-tight">Products</h1>
            <p className="text-sm admin-text-secondary mt-1">Manage your B2B product catalog and inventory.</p>
          </div>
          <button
            onClick={handleAddNew}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-full cursor-pointer admin-action-button"
          >
            + Add New Product
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Products", value: totalProducts, icon: <Package className="w-5 h-5" /> },
            { title: "Active Products", value: activeProducts, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
          ].map((stat, idx) => (
            <div key={idx} className="admin-bg-card rounded-[24px] p-5 border border-transparent hover:admin-bg-elevated transition-colors cursor-default">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs font-medium admin-text-secondary">{stat.title}</h3>
                <div className="admin-text-accent">{stat.icon}</div>
              </div>
              <p className="text-3xl font-normal admin-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted group-focus-within:admin-text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 admin-bg-primary border border-transparent admin-text-primary placeholder:admin-text-muted rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 admin-text-muted hover:admin-text-primary">
                ✕
              </button>
            )}
          </div>
          
          <div className="flex gap-3 overflow-x-auto overscroll-contain-x no-scrollbar">
            <div className="relative shrink-0 min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted" />
              <select
                value={sortBy}
                title="Sort products"
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {PRODUCT_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="admin-bg-card">{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="relative shrink-0 min-w-[160px]">
              <select
                value={categoryFilter}
                title="Filter by category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                <option value="all" className="admin-bg-card">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="admin-bg-card">{c.name}</option>
                ))}
              </select>
            </div>

            <div className="relative shrink-0 min-w-[140px]">
              <select
                value={statusFilter}
                title="Filter by status"
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {PRODUCT_STATUS_FILTERS.map(opt => (
                  <option key={opt.value} value={opt.value} className="admin-bg-card">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
          {isLoading && products.length > 0 && (
            <div className="w-full h-1 admin-bg-elevated overflow-hidden">
              <div className="h-full bg-[#A8C7FA] animate-pulse w-1/3 rounded-r-full"></div>
            </div>
          )}
          <div className="overflow-x-auto overscroll-contain-x no-scrollbar">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="admin-bg-primary">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest w-16">Img</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Name & SKU</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Pricing</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">B2B Rule</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Stock</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-medium admin-text-muted uppercase tracking-widest">Updated</th>
                  <th className="px-6 py-4 text-right text-xs font-medium admin-text-muted uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y admin-border">
                {filteredProducts.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center admin-text-muted font-medium">
                      No products found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((product) => {
                    const imageUrl = product.images?.[0] ? imageUrls.get(product.id) : null
                    
                    const displayPrice = product.retail_price
                  
                    const displayB2bPrice = product.wholesale_price
                    const displayB2bQty = product.wholesale_min_qty

                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => handleEdit(product)}
                        className="hover:admin-bg-elevated transition-all duration-150 cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {imageUrl ? (
                            <div className="w-12 h-12 admin-bg-primary border admin-border rounded-xl overflow-hidden shadow-sm">
                              <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 admin-bg-primary border admin-border rounded-xl flex items-center justify-center">
                              <Package className="w-5 h-5 admin-text-muted" />
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="font-medium admin-text-primary text-[15px] group-hover:admin-text-accent transition-colors line-clamp-2">
                            {product.name}
                          </div>
                          <div className="text-xs admin-text-muted font-mono mt-1 tracking-wide">
                            {product.sku || 'NO-SKU'}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium admin-text-primary">
                              {formatCurrency(displayPrice)}
                            </div>
                            {product.mrp && product.mrp > displayPrice && (
                              <div className="text-[11px] admin-text-muted line-through mt-0.5">
                                {formatCurrency(product.mrp)}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {displayB2bPrice && displayB2bQty ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(displayB2bPrice)}</span>
                              <span className="text-[11px] admin-text-secondary mt-0.5">Min Qty: {displayB2bQty}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-[#565959] italic">No B2B rules</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              product.stock <= 5 && product.stock > 0 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : product.stock === 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'admin-text-primary'
                            }`}>
                              {product.stock}
                            </span>
                            {product.stock <= 5 && product.stock > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">LOW</span>}
                            {product.stock === 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">OUT</span>}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase ${
                            product.status === 'published'
                              ? 'admin-badge-delivered border border-[var(--admin-status-delivered-text)]/20'
                              : product.status === 'draft'
                              ? 'admin-bg-elevated admin-text-secondary border admin-border'
                              : 'admin-badge-pending border border-[var(--admin-status-pending-text)]/20'
                          }`}>
                            {product.status === 'published' ? 'PUBLISHED' : product.status === 'draft' ? 'DRAFT' : 'ARCHIVED'}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm admin-text-muted">
                          {formatIST(product.updated_at)}
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                               onClick={(e) => handleEdit(product, e)}
                               className="p-2 admin-text-accent hover:bg-[#0B57D0]/20 rounded-full transition-colors cursor-pointer"
                               title="Edit Product"
                             >
                               <Edit className="w-4 h-4" />
                             </button>
                             {isSuperAdmin && (
                               <button 
                                  onClick={(e) => { e.stopPropagation(); setProductToDelete(product); }}
                                  className="p-2 rounded-full hover:admin-bg-elevated transition-all duration-200 cursor-pointer"
                                 title="Delete Product"
                               >
                                 <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                               </button>
                             )}
                          </div>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <ProductForm
          initialData={editingProduct ? { 
            ...editingProduct, 
            mrp: editingProduct.mrp ?? '',
            retail_price: editingProduct.retail_price ?? '',
            wholesale_price: editingProduct.wholesale_price ?? '',
            wholesale_min_qty: editingProduct.wholesale_min_qty ?? 1,
            frequently_bought_together: editingProduct.frequently_bought_together || [],
            weight_unit: (editingProduct.weight_unit === 'g' || editingProduct.weight_unit === 'kg') ? editingProduct.weight_unit : 'kg',
            dimensions: editingProduct.dimensions || { length: '', width: '', height: '' }
          } : undefined}
          categories={categories}
          allProducts={products.map(p => ({ id: p.id, name: p.name }))}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Modal>

      <AdminConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Product Permanently?"
        description={`You are about to completely delete "${productToDelete?.name}". This removes it and its images from the database and cannot be recovered.`}
        confirmText="Delete Product"
        isDestructive={true}
        requireMatch={productToDelete?.sku || "DELETE"}
        isLoading={isSubmitting}
      />
    </>
  )
}