// src/app/admin/products/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import ProductForm from '@/components/admin/ProductForm'
import { Product as BaseProduct } from '@/types/database.types'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import StatsCard from '@/components/admin/StatsCard'
import { Package, CheckCircle } from 'lucide-react'

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isError = type === 'error'

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up flex items-center gap-3 text-sm font-medium">
      {isError ? (
        <span className="text-red-400">⚠️</span>
      ) : (
        <span className="text-green-400">✓</span>
      )}
      <span>{message}</span>
    </div>
  )
}

const formatIST = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date).toUpperCase()
}

// Extend the base product type to include the new status & rating fields
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const supabase = createClient()

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  // Load public URLs for product images after products are loaded
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
      // Build lookup map
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
      
      // Map UI 'status' back to DB 'is_active'
      if ('status' in payload) {
        payload.is_active = payload.status === 'published'
        delete payload.status
      }
      
      // Fix empty string for UUID column
      if (payload.category_id === '') {
        payload.category_id = null
      }

      // 🚨 FIX: Now including rating and review_count in the database payload!
      const dbPayload = {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        price: payload.price,
        selling_price: payload.selling_price,
        bulk_price: payload.bulk_price,
        bulk_min_quantity: payload.bulk_min_quantity,
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
        const { error } = await supabase
          .from('products')
          .update(dbPayload)
          .eq('id', editingProduct.id)
        
        if (error) {
          console.error("Update error:", error.message || error)
          throw new Error(error.message || 'Failed to update product')
        }
        showToast('Product updated successfully', 'success')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(dbPayload)
        
        if (error) {
          console.error("Insert error:", error.message || error)
          throw new Error(error.message || 'Failed to create product')
        }
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

  const handleEdit = async (product: Product) => {
    try {
      const { data: fullProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single()
      
      if (error) throw error
      
      // Map is_active back to status so the form populates correctly
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
      showToast('Product deleted successfully', 'success')
    } catch (error) {
      showToast('Failed to delete product', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading products...</span>
        </div>
      </div>
    )
  }

  // Apply filters locally
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'updated_desc') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    if (sortBy === 'price_asc') return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    return 0
  })

  // Calculate stats
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'published').length

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <select
              value={sortBy}
              title="Sort products"
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="newest">Newly Added</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
            </select>
            <select
              value={categoryFilter}
              title="Filter by category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              title="Filter products by status"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={handleAddNew}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatsCard
            title="Total Products"
            value={totalProducts}
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Active Products"
            value={activeProducts}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all text-sm"
          />
          <svg className="absolute left-4 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sortedProducts.map((product) => {
                  const imageUrl = product.images?.[0] ? imageUrls.get(product.id) : null
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {imageUrl ? (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                            -
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(product.category_id && categoryMap.get(product.category_id)) || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <span className={product.stock <= 5 ? 'text-orange-600 font-medium' : ''}>
                          {product.stock}
                        </span>
                        {product.stock <= 5 && product.stock > 0 && (
                          <span className="ml-1 text-xs text-orange-600">(Low stock)</span>
                        )}
                        {product.stock === 0 && (
                          <span className="ml-1 text-xs text-red-600">(Out of stock)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          product.status === 'published' 
                            ? 'bg-green-50 text-green-700 border-green-200/50'
                            : product.status === 'draft'
                            ? 'bg-gray-100 text-gray-700 border-gray-200/50'
                            : 'bg-gray-50 text-gray-700 border-gray-200/50'
                        }`}>
                          {product.status === 'published' ? 'Published' : product.status === 'draft' ? 'Draft' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatIST(product.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {sortedProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {searchQuery ? (
                          <p>No products match "{searchQuery}"</p>
                        ) : (
                          <>
                            <p>No products found</p>
                            <button
                              onClick={handleAddNew}
                              className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                              Add your first product
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
        >
          <ProductForm
            initialData={editingProduct ? { ...editingProduct, frequently_bought_together: editingProduct.frequently_bought_together || [] } : undefined}
            categories={categories}
            allProducts={products.map(p => ({ id: p.id, name: p.name }))}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProductToDelete(null)} />
            <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h2>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{productToDelete.name}</span>? 
                This will also delete all associated images and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setProductToDelete(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  )
}