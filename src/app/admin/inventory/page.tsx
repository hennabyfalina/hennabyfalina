'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getPublicUrl } from '@/lib/supabase/storage'
import { formatCurrency } from '@/lib/utils'
import StockUpdateModal from '@/components/admin/StockUpdateModal'
import StatsCard from '@/components/admin/StatsCard'
import { Package, AlertTriangle, XCircle, IndianRupee } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  images: string[]
  status: 'draft' | 'published' | 'archived'
  is_active?: boolean
  sku: string | null
  updated_at?: string
  selling_price?: number
}

// Toast component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isError = type === 'error'

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up flex items-center gap-3 text-sm font-medium">
      {isError ? <span className="text-red-400">⚠️</span> : <span className="text-green-400">✓</span>}
      {message}
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

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const supabase = createClient()

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Load public URLs for product images
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
        .order('name', { ascending: true })
      
      if (error) throw error
      
      // Map database 'is_active' to UI 'status'
      const mappedData = (data || []).map((p: any) => ({
        ...p,
        status: p.is_active ? 'published' : 'draft'
      }))

      setProducts(mappedData)
      setFilteredProducts(mappedData)
    } catch (error) {
      console.error('Failed to load products:', error)
      showToast('Failed to load products', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10)
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => p.stock === 0)
    } else if (stockFilter === 'in') {
      filtered = filtered.filter(p => p.stock > 0)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'updated_desc') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      if (sortBy === 'stock_asc') return a.stock - b.stock
      if (sortBy === 'stock_desc') return b.stock - a.stock
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      return 0
    })

    setFilteredProducts(filtered)
  }, [searchQuery, stockFilter, statusFilter, sortBy, products])

  const handleUpdateSuccess = () => {
    setSelectedProduct(null)
    showToast('Stock updated successfully', 'success')
    loadProducts() // Refresh to get correct DB log records & state
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Out of Stock</span>
    }
    if (stock <= 5) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">Critical ({stock})</span>
    }
    if (stock <= 10) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Low ({stock})</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">In Stock ({stock})</span>
  }

  // Calculate stats
  const totalProducts = products.length
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length
  const outOfStockCount = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading inventory...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage product stock levels</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/inventory/logs"
              className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Logs
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Products"
            value={totalProducts}
            icon={<Package className="w-5 h-5" />}
          />
          <StatsCard
            title="Low Stock"
            value={lowStockCount}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
          />
          <StatsCard
            title="Out of Stock"
            value={outOfStockCount}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
          <StatsCard
            title="Total Value"
            value={formatCurrency(totalValue)}
            icon={<IndianRupee className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sortBy}
            title="Sort inventory"
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="stock_asc">Stock (Low - High)</option>
            <option value="stock_desc">Stock (High - Low)</option>
          </select>
          <select
            value={stockFilter}
            title="Filter by stock level"
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock (≤10)</option>
            <option value="out">Out of Stock</option>
          </select>
          <select
            value={statusFilter}
            title="Filter by product status"
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Updated</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredProducts.map((product) => {
                  const imageUrl = product.images?.[0] ? imageUrls.get(product.id) : null
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {imageUrl ? (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                            -
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/products/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStockBadge(product.stock)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.status === 'published' ? 'bg-green-100 text-green-700' :
                          product.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status === 'published' ? 'Published' : product.status === 'draft' ? 'Draft' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatIST(product.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      <StockUpdateModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onSuccess={handleUpdateSuccess}
      />

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
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}