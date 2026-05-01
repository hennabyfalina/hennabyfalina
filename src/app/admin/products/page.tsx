// src/app/admin/products/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import ProductForm from '@/components/admin/ProductForm'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import AdminLoader from '@/components/admin/AdminLoader'
import { Product as BaseProduct } from '@/types/database.types'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Package, CheckCircle, Search, Filter, Trash2, Edit } from 'lucide-react'

// 🚨 IMPORTED DRY CONSTANTS 🚨
import { PRODUCT_STATUS_FILTERS, PRODUCT_SORT_OPTIONS } from '@/lib/constants'

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
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const supabase = createClient()

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

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
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

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    try {
      const payload = { ...formData }
      
      if ('status' in payload) {
        payload.is_active = payload.status === 'published'
        delete payload.status
      }
      
      if (payload.category_id === '') payload.category_id = null

      const safeBulkPrice = payload.bulk_price === '' || payload.bulk_price === undefined ? null : payload.bulk_price
      const safeBulkMinQty = payload.bulk_min_quantity === '' || payload.bulk_min_quantity === undefined ? null : payload.bulk_min_quantity
      const safeSellingPrice = payload.selling_price === '' || payload.selling_price === undefined ? null : payload.selling_price

      const dbPayload = {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        price: payload.price,
        selling_price: safeSellingPrice,
        bulk_price: safeBulkPrice,
        bulk_min_quantity: safeBulkMinQty,
        stock: payload.stock,
        category_id: payload.category_id,
        images: payload.images,
        is_active: payload.is_active,
        sku: payload.sku || null,
        weight: payload.weight || null,
        dimensions: payload.dimensions || null,
        meta_title: payload.meta_title || null,
        meta_description: payload.meta_description || null,
        rating: payload.rating ?? 4.5,
        review_count: payload.review_count ?? 128,
        frequently_bought_together: payload.frequently_bought_together || [],
      }

      if (editingProduct) {
        const { error } = await supabase.from('products').update(dbPayload).eq('id', editingProduct.id)
        if (error) throw new Error(error.message || 'Failed to update product')
        showToast('Product updated successfully', 'success')
      } else {
        const { error } = await supabase.from('products').insert(dbPayload)
        if (error) throw new Error(error.message || 'Failed to create product')
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
    try {
      const { data: fullProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single()
      
      if (error) throw error
      
      fullProduct.status = fullProduct.is_active ? 'published' : 'draft'
      setEditingProduct(fullProduct)
      setIsModalOpen(true)
    } catch (error) {
      showToast('Failed to load product details', 'error')
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id)
      
      if (error) throw error
      
      await loadProducts()
      setProductToDelete(null)
      showToast('Product permanently deleted', 'success')
    } catch (error) {
      showToast('Failed to delete product', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Fetching product database..." />
      </div>
    )
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'updated_desc') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    if (sortBy === 'price_asc') return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    return 0
  })

  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'published').length

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight leading-tight">Products</h1>
            <p className="text-sm text-[#C4C7C5] mt-1">Manage your B2B product catalog and inventory.</p>
          </div>
          <button
            onClick={handleAddNew}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-[#0B57D0] text-white rounded-full hover:bg-[#0842A0] transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            + Add New Product
          </button>
        </div>

        {/* Gemini-Inspired Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Products", value: totalProducts, icon: <Package className="w-5 h-5" /> },
            { title: "Active Products", value: activeProducts, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#1E1F20] rounded-[24px] p-5 border border-transparent hover:bg-[#282A2C] transition-colors cursor-default">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs font-medium text-[#C4C7C5]">{stat.title}</h3>
                <div className="text-[#A8C7FA]">{stat.icon}</div>
              </div>
              <p className="text-3xl font-normal text-[#E3E3E3]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Gemini Floating Controls */}
        <div className="flex flex-col md:flex-row gap-3 bg-[#1E1F20] p-3 rounded-[24px] border border-[#333538]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196] group-focus-within:text-[#A8C7FA] transition-colors" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-[#131314] border border-transparent text-[#E3E3E3] placeholder:text-[#8E9196] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E9196] hover:text-[#E3E3E3]">
                ✕
              </button>
            )}
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {/* 🚨 DRY Sort Dropdown 🚨 */}
            <div className="relative shrink-0 min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196]" />
              <select
                value={sortBy}
                title="Sort products"
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {PRODUCT_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative shrink-0 min-w-[160px]">
              <select
                value={categoryFilter}
                title="Filter by category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                <option value="all" className="bg-[#1E1F20]">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#1E1F20]">{c.name}</option>
                ))}
              </select>
            </div>

            {/* 🚨 DRY Status Filter 🚨 */}
            <div className="relative shrink-0 min-w-[140px]">
              <select
                value={statusFilter}
                title="Filter by status"
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {PRODUCT_STATUS_FILTERS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enterprise Products Table */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden">
          {isLoading && products.length > 0 && (
            <div className="w-full h-1 bg-[#282A2C] overflow-hidden">
              <div className="h-full bg-[#A8C7FA] animate-pulse w-1/3 rounded-r-full"></div>
            </div>
          )}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-[#131314]">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest w-16">Img</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Name & SKU</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Pricing</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">B2B Rule</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Stock</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8E9196] uppercase tracking-widest">Updated</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[#8E9196] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333538]">
                {filteredProducts.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#8E9196] font-medium">
                      No products found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((product) => {
                    const imageUrl = product.images?.[0] ? imageUrls.get(product.id) : null
                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => handleEdit(product)}
                        className="hover:bg-[#282A2C] transition-colors cursor-pointer group"
                      >
                        {/* Image */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {imageUrl ? (
                            <div className="w-12 h-12 bg-[#131314] border border-[#333538] rounded-xl overflow-hidden shadow-sm">
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-[#131314] border border-[#333538] rounded-xl flex items-center justify-center text-xs text-[#565959]">-</div>
                          )}
                        </td>
                        
                        {/* Name & SKU */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#E3E3E3] text-[15px] group-hover:text-[#A8C7FA] transition-colors line-clamp-2">
                            {product.name}
                          </div>
                          <div className="text-xs text-[#8E9196] font-mono mt-1 tracking-wide">
                            {product.sku || 'NO-SKU'}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#E3E3E3]">
                            {formatCurrency(product.selling_price ?? product.price)}
                          </div>
                          {product.selling_price && product.selling_price < product.price && (
                            <div className="text-[11px] text-[#8E9196] line-through mt-0.5">
                              {formatCurrency(product.price)}
                            </div>
                          )}
                        </td>
                        
                        {/* B2B Wholesale */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.bulk_price && product.bulk_min_quantity ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#93D7A4]">{formatCurrency(product.bulk_price)}</span>
                              <span className="text-[11px] text-[#C4C7C5] mt-0.5">Min Qty: {product.bulk_min_quantity}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#565959] italic">No bulk rules</span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${product.stock <= 5 && product.stock > 0 ? 'text-[#F9AB00]' : product.stock === 0 ? 'text-red-400' : 'text-[#E3E3E3]'}`}>
                              {product.stock}
                            </span>
                            {product.stock <= 5 && product.stock > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3C1E0A] text-[#F9AB00] border border-[#4E270D]">LOW</span>}
                            {product.stock === 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4D2628] text-[#F2B8B5] border border-[#8C1D18]">OUT</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase ${
                            product.status === 'published' 
                              ? 'bg-[#214332]/30 text-[#93D7A4] border border-[#214332]'
                              : product.status === 'draft'
                              ? 'bg-[#282A2C] text-[#C4C7C5] border border-[#333538]'
                              : 'bg-[#4A4431]/30 text-[#F1DF9E] border border-[#4A4431]'
                          }`}>
                            {product.status}
                          </span>
                        </td>

                        {/* Updated Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8E9196]">
                          {formatIST(product.updated_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => handleEdit(product, e)} 
                              className="p-2 text-[#A8C7FA] hover:bg-[#0B57D0]/20 rounded-full transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setProductToDelete(product); }} 
                              className="p-2 text-[#F2B8B5] hover:bg-[#8C1D18]/40 rounded-full transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Editing Modal Component */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <ProductForm
          initialData={editingProduct ? { ...editingProduct, frequently_bought_together: editingProduct.frequently_bought_together || [] } : undefined}
          categories={categories}
          allProducts={products.map(p => ({ id: p.id, name: p.name }))}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* 🚨 TWO-STEP VERIFICATION MODAL FOR DELETION 🚨 */}
      <AdminConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Product Permanently?"
        description={`You are about to completely delete "${productToDelete?.name}". This removes it and its images from the database and cannot be recovered.`}
        confirmText="Delete Product"
        isDestructive={true}
        requireMatch={productToDelete?.sku || "DELETE"} // 🚨 Enforces typing SKU or "DELETE"
        isLoading={isSubmitting}
      />
    </>
  )
}