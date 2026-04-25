'use client'

import { useState, useEffect } from 'react'
import { uploadProductImage, deleteProductImage, getPublicUrl } from '@/lib/supabase/storage'

interface CategoryFormData {
  name: string
  slug: string
  description: string | null
  image: string | null
  parent_id: string | null
  is_active: boolean
  meta_title: string | null
  meta_description: string | null
  low_stock_threshold: number
  updated_at?: string
}

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData> & { id?: string }
  categories?: Array<{ id: string; name: string }>
  onSubmit: (data: CategoryFormData) => Promise<void>
  isLoading?: boolean
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

// 🔒 Validation helper
const validateCategory = (data: CategoryFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name.trim()) errors.push('Category name is required')
  if (!data.slug.trim()) errors.push('Category slug is required')
  if (data.low_stock_threshold < 0) errors.push('Low stock threshold cannot be negative')
  
  // Validate slug format
  if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens')
  }
  
  // Prevent self-parenting
  
  return { isValid: errors.length === 0, errors }
}

export default function CategoryForm({
  initialData = {},
  categories = [],
  onSubmit,
  isLoading = false,
}: CategoryFormProps) {
  const [initialFormData] = useState<CategoryFormData>({
    name: initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    image: initialData.image || null,
    parent_id: initialData.parent_id || null,
    is_active: initialData.is_active ?? true,
    meta_title: initialData.meta_title || '',
    meta_description: initialData.meta_description || '',
    low_stock_threshold: initialData.low_stock_threshold || 10,
    updated_at: initialData.updated_at,
  })

  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'settings' | 'seo'>('basic')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // Check if user has made any modifications
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) || newImageFile !== null

  // Load existing image URL if editing (now using public URLs)
  useEffect(() => {
    const loadImage = async () => {
      if (formData.image && !formData.image.startsWith('http')) {
        const publicUrl = getPublicUrl(formData.image)
        setExistingImageUrl(publicUrl)
      } else if (formData.image) {
        setExistingImageUrl(formData.image)
      }
    }
    loadImage()
  }, [formData.image])

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    // Auto-generate slug from name
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
        [name]: type === 'checkbox' ? checked : name === 'low_stock_threshold' ? parseInt(value) || 0 : value,
      }))
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error')
      return
    }

    setNewImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setNewImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image: null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🔒 Validate form data
    const { isValid, errors } = validateCategory(formData)
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
    let imagePath = formData.image
    if (newImageFile) {
      try {
        showToast('Uploading image...', 'info')
        imagePath = await uploadProductImage(newImageFile)
        showToast('Image uploaded successfully', 'success')
      } catch (error) {
        console.error('Image upload failed:', error)
        showToast('Failed to upload image', 'error')
        return
      }
    }

    // Delete old image if replaced
    if (formData.image && newImageFile && !formData.image.startsWith('http')) {
      try {
        await deleteProductImage(formData.image)
      } catch (err) {
        console.error('Failed to delete old image:', err)
      }
    }

    await onSubmit({
      ...formData,
      image: imagePath,
      parent_id: formData.parent_id === '' ? null : formData.parent_id,
      meta_title: formData.meta_title?.trim() || null,
      meta_description: formData.meta_description?.trim() || null,
      description: formData.description?.trim() || null,
    })

    setNewImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-1 sm:gap-2 min-w-max">
            {['basic', 'settings', 'seo'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'basic' && 'Basic Info'}
                {tab === 'settings' && 'Settings'}
                {tab === 'seo' && 'SEO'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Corrugated Boxes"
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
                  placeholder="corrugated-boxes"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                title="Select parent category"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Top Level)</option>
                {categories.filter(c => c.id !== initialData.id).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Describe this category..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image
              </label>
              <div className="mt-1 flex items-center gap-4">
                {(imagePreview || existingImageUrl) && (
                  <div className="relative w-24 h-24">
                    <img
                      src={imagePreview || existingImageUrl || ''}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  title="Upload category image"
                  placeholder="Choose image"
                  onChange={handleImageSelect}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 400x400px, max 5MB. JPEG, PNG, WebP.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                title="Low stock threshold"
                placeholder="10"
                onChange={handleChange}
                min="0"
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when products in this category drop below this stock level.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                title="Toggle category visibility"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Active (visible in store)</label>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div>
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
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : initialData.id ? 'Save Category' : 'Create Category'}
        </button>
      </form>

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Save</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {initialData.id ? 'update' : 'create'} this category?
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

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}