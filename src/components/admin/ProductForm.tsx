// src/components/admin/ProductForm.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { uploadProductImage, deleteProductImage, getPublicUrl } from '@/lib/supabase/storage'

interface ProductFormData {
  name: string
  slug: string
  description: string | null
  price: number
  selling_price: number
  bulk_price: number | null
  bulk_min_quantity: number | null
  stock: number
  sku: string | null
  category_id: string | null
  images: string[]
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  weight: number | null
  dimensions: { length: number; width: number; height: number }
  updated_at?: string
  meta_title?: string | null
  meta_description?: string | null
  rating?: number | null
  review_count?: number | null
  frequently_bought_together: string[]
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string }
  categories: Array<{ id: string; name: string }>
  allProducts: Array<{ id: string; name: string }>
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading?: boolean
}

const MAX_IMAGES = 10
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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

// 🔒 Validation helper
const validateProduct = (data: ProductFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name.trim()) errors.push('Product name is required')
  if (!data.slug.trim()) errors.push('Product slug is required')
  if (data.price <= 0) errors.push('Price must be greater than 0')
  if (data.selling_price <= 0) errors.push('Selling price must be greater than 0')
  if (data.selling_price > data.price) errors.push('Selling price cannot be higher than regular price')
  if (data.stock < 0) errors.push('Stock cannot be negative')
  if (data.bulk_price && data.bulk_price < 0) errors.push('Bulk price cannot be negative')
  if (data.bulk_min_quantity && data.bulk_min_quantity < 1) errors.push('Bulk minimum quantity must be at least 1')
  
  // Amazon Trust Metrics validation
  if (data.rating !== null && data.rating !== undefined) {
    if (data.rating < 0 || data.rating > 5) errors.push('Rating must be between 0.0 and 5.0')
  }
  if (data.review_count !== null && data.review_count !== undefined) {
    if (data.review_count < 0) errors.push('Review count cannot be negative')
  }
  
  // Validate slug format
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens')
  }
  
  // Validate dimensions if provided
  if (data.dimensions) {
    if (data.dimensions.length < 0) errors.push('Length cannot be negative')
    if (data.dimensions.width < 0) errors.push('Width cannot be negative')
    if (data.dimensions.height < 0) errors.push('Height cannot be negative')
  }
  
  return { isValid: errors.length === 0, errors }
}

export default function ProductForm({
  initialData = {},
  categories,
  allProducts,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const [initialFormData, setInitialFormData] = useState<ProductFormData>({
    name: initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    price: initialData.price || 0,
    selling_price: initialData.selling_price || 0,
    bulk_price: initialData.bulk_price || null,
    bulk_min_quantity: initialData.bulk_min_quantity || 10,
    stock: initialData.stock || 0,
    sku: initialData.sku || null,
    category_id: initialData.category_id || null,
    images: initialData.images || [],
    status: initialData.status || 'published',
    is_featured: initialData.is_featured || false,
    weight: initialData.weight || null,
    dimensions: initialData.dimensions || { length: 0, width: 0, height: 0 },
    updated_at: initialData.updated_at,
    meta_title: initialData.meta_title || null,
    meta_description: initialData.meta_description || null,
    rating: initialData.rating ?? 4.5,
    review_count: initialData.review_count ?? 128,
    frequently_bought_together: initialData.frequently_bought_together || [],
  })

  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<Map<string, string>>(new Map())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'inventory' | 'seo' | 'bundles'>('basic')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bundleSearch, setBundleSearch] = useState('')

  // Check if user has made any modifications
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) || newImageFiles.length > 0

  // Load public URLs for existing images
  useEffect(() => {
    const loadExistingUrls = () => {
      const urls = new Map<string, string>()
      for (const path of formData.images) {
        const publicUrl = getPublicUrl(path)
        urls.set(path, publicUrl)
      }
      setExistingImageUrls(urls)
    }
    if (formData.images.length > 0) {
      loadExistingUrls()
    }
  }, [formData.images])

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: initialData.slug ? prev.slug : slug
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const parsed = parseFloat(value)
    
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(parsed) ? (name === 'price' || name === 'stock' ? 0 : null) : parsed,
    }))
  }

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: parseFloat(value) || 0
      }
    }))
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file format. Allowed: JPEG, PNG, WebP'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit'
    }
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const totalImages = formData.images.length + newImageFiles.length + files.length
    if (totalImages > MAX_IMAGES) {
      showToast(`Maximum ${MAX_IMAGES} images allowed`, 'error')
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      showToast(errors.join(', '), 'error')
    }

    if (validFiles.length > 0) {
      setNewImageFiles(prev => [...prev, ...validFiles])
      const previews = validFiles.map(file => URL.createObjectURL(file))
      setNewImagePreviews(prev => [...prev, ...previews])
      showToast(`${validFiles.length} image(s) added`, 'success')
    }
  }

  const handleBulkUpload = () => {
    fileInputRef.current?.click()
  }

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index])
    const updatedFiles = [...newImageFiles]
    const updatedPreviews = [...newImagePreviews]
    updatedFiles.splice(index, 1)
    updatedPreviews.splice(index, 1)
    setNewImageFiles(updatedFiles)
    setNewImagePreviews(updatedPreviews)
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updated = [...formData.images]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    setFormData(prev => ({ ...prev, images: updated }))
  }

  const confirmDeleteExistingImage = (path: string) => {
    setDeleteConfirmPath(path)
  }

  const handleDeleteExistingImage = async () => {
    if (!deleteConfirmPath) return
    
    try {
      await deleteProductImage(deleteConfirmPath)
      const updatedImages = formData.images.filter(p => p !== deleteConfirmPath)
      setFormData(prev => ({ ...prev, images: updatedImages }))
      setExistingImageUrls(prev => {
        const newMap = new Map(prev)
        newMap.delete(deleteConfirmPath)
        return newMap
      })
      showToast('Image deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete image:', error)
      showToast('Failed to delete image', 'error')
    } finally {
      setDeleteConfirmPath(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🔒 Validate form data
    const { isValid, errors } = validateProduct(formData)
    if (!isValid) {
      setValidationErrors(errors)
      showToast('Please fix the errors before saving', 'error')
      return
    }
    setValidationErrors([])
    setShowSaveConfirm(true)
  }

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false)
    let uploadedPaths: string[] = []
    if (newImageFiles.length > 0) {
      try {
        showToast(`Uploading ${newImageFiles.length} image(s)...`, 'info')
        uploadedPaths = await Promise.all(
          newImageFiles.map(file => uploadProductImage(file))
        )
        showToast('Images uploaded successfully', 'success')
      } catch (error) {
        console.error('Image upload failed:', error)
        showToast('Failed to upload images', 'error')
        return
      }
    }

    const allImagePaths = [...formData.images, ...uploadedPaths]
    
    const finalDimensions = (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height)
      ? formData.dimensions
      : null

    try {
      await onSubmit({
        ...formData,
        images: allImagePaths,
        dimensions: finalDimensions as any,
      })

      setNewImageFiles([])
      newImagePreviews.forEach(preview => URL.revokeObjectURL(preview))
      setNewImagePreviews([])
    } catch (error) {
      console.error('Form submission failed:', error)
      showToast('Failed to save product', 'error')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Validation Errors Summary */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab Navigation - Responsive */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-1 sm:gap-2 min-w-max">
            {['basic', 'images', 'inventory', 'seo', 'bundles'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'basic' && 'Basic Info'}
                {tab === 'images' && 'Images'}
                {tab === 'inventory' && 'Inventory'}
                {tab === 'seo' && 'SEO'}
                {tab === 'bundles' && 'Bundles'}
              </button>
            ))}
          </nav>
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {initialData.updated_at && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 mb-2">
                Last Updated: {formatIST(initialData.updated_at)}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Product Name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="product-slug"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Describe the product features and specifications..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  title="Select Category"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  title="Product Status"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                title="Feature this product"
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Featured Product (show on homepage)</label>
            </div>

            {/* 🚨 Amazon Trust Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (0 - 5.0)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating ?? ''}
                  placeholder="4.5"
                  onChange={handleNumberChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Reviews (e.g. 128)
                </label>
                <input
                  type="number"
                  name="review_count"
                  value={formData.review_count ?? ''}
                  placeholder="128"
                  onChange={handleNumberChange}
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  placeholder="0.00"
                  onChange={handleNumberChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price || ''}
                placeholder="0.00"
                onChange={handleNumberChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bulk Price (₹)
                </label>
                <input
                  type="number"
                  name="bulk_price"
                  value={formData.bulk_price || ''}
                  placeholder="0.00"
                  onChange={handleNumberChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bulk Min Qty
              </label>
              <input
                type="number"
                name="bulk_min_quantity"
                value={formData.bulk_min_quantity || ''}
                placeholder="10"
                onChange={handleNumberChange}
                min="1"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            </div>

          </div>
        )}

        {/* Images Tab - Responsive */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Images ({formData.images.length + newImageFiles.length} / {MAX_IMAGES})
              </label>
              <button
                type="button"
                onClick={handleBulkUpload}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 w-full sm:w-auto"
              >
                Bulk Upload
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              title="Upload Images"
              placeholder="Choose images"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={handleBulkUpload}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600">Click or drag images to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 5MB each</p>
            </div>

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">New Images</p>
                <div className="flex flex-wrap gap-3">
                  {newImagePreviews.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="Preview" className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Images */}
            {formData.images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Existing Images (drag to reorder)
                </p>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((path, idx) => {
                    const publicUrl = existingImageUrls.get(path)
                    return (
                      <div key={path} className="relative group cursor-move" draggable onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx.toString())
                      }} onDrop={(e) => {
                        e.preventDefault()
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'))
                        reorderImages(fromIdx, idx)
                      }} onDragOver={(e) => e.preventDefault()}>
                        {publicUrl ? (
                          <img src={publicUrl} alt="Product" className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs">Loading...</div>
                        )}
                        <button
                          type="button"
                          onClick={() => confirmDeleteExistingImage(path)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-1 rounded">
                          {idx + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab - Responsive */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ''}
                  onChange={handleChange}
                  placeholder="Unique product code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  placeholder="0"
                  onChange={handleNumberChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight || ''}
                placeholder="0.00"
                onChange={handleNumberChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <input
                  type="number"
                  placeholder="Length"
                  title="Length in cm"
                  value={formData.dimensions.length || ''}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  step="0.1"
                  min="0"
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Width"
                  title="Width in cm"
                  value={formData.dimensions.width || ''}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  step="0.1"
                  min="0"
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Height"
                  title="Height in cm"
                  value={formData.dimensions.height || ''}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  step="0.1"
                  min="0"
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab - Responsive */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                name="meta_title"
                value={formData.meta_title || ''}
                onChange={handleChange}
                placeholder="SEO Title (Optional)"
                maxLength={60}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.meta_title?.length || 0}/60 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                name="meta_description"
                value={formData.meta_description || ''}
                onChange={handleChange}
                placeholder="SEO Description (Optional)"
                rows={3}
                maxLength={160}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.meta_description?.length || 0}/160 characters
              </p>
            </div>
          </div>
        )}

        {/* Bundles Tab - Responsive */}
        {activeTab === 'bundles' && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequently Bought Together
              </label>
              <p className="text-xs text-gray-500 mb-3">Select products to recommend as a bundle on this product's page.</p>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[300px]">
                <div className="p-2 border-b border-gray-200 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={bundleSearch}
                    onChange={(e) => setBundleSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
                  {allProducts
                    .filter(p => p.id !== initialData?.id) // Prevent self-bundling
                    .filter(p => p.name.toLowerCase().includes(bundleSearch.toLowerCase()))
                    .map(p => {
                      const isSelected = formData.frequently_bought_together.includes(p.id)
                      return (
                        <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setFormData(prev => ({
                                ...prev,
                                frequently_bought_together: checked 
                                  ? [...prev.frequently_bought_together, p.id]
                                  : prev.frequently_bought_together.filter(id => id !== p.id)
                              }))
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 select-none flex-1">{p.name}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </form>

      {/* Delete Confirmation Modal */}
      {deleteConfirmPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-5 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Image</h3>
            <p className="text-gray-600 mb-5 sm:mb-6">Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
              <button onClick={() => setDeleteConfirmPath(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 w-full sm:w-auto">
                Cancel
              </button>
              <button onClick={handleDeleteExistingImage} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full sm:w-auto">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Save</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {initialData.id ? 'update' : 'create'} this product?
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowSaveConfirm(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-center sm:text-left ${
          toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}