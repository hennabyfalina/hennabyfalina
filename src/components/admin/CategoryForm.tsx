// src/components/admin/CategoryForm.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { uploadProductImage, deleteProductImage, getPublicUrl } from '@/lib/supabase/storage'
import { showToast } from '@/components/ui/Toast' // 🚨 Utilizing Global Toast
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal' // 🚨 DRY Architecture
import { UploadCloud, AlertTriangle, CheckCircle2, Image as ImageIcon } from 'lucide-react'

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
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date).toUpperCase()
}

// 🚨 Validation helper
const validateCategory = (data: CategoryFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name.trim()) errors.push('Category name is required')
  if (!data.slug.trim()) errors.push('Category slug is required')
  if (data.low_stock_threshold < 0) errors.push('Low stock threshold cannot be negative')
  
  // Validate slug format
  if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens')
  }
  
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
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if user has made any modifications
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) || newImageFile !== null

  // Load existing image URL if editing
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

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPEG, PNG, WebP)', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error')
      return
    }

    setNewImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    showToast('Image staged for upload', 'info')
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setNewImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image: null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        showToast('Uploading category image...', 'info')
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

  const inputClass = "w-full px-4 py-3 bg-[#131314] border border-[#333538] text-[#E3E3E3] placeholder:text-[#565959] rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all"
  const labelClass = "block text-[13px] font-medium text-[#8E9196] mb-1.5 ml-1 uppercase tracking-wider"

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 text-[#E3E3E3]">
        
        {/* 🚨 GEMINI ERROR BANNER 🚨 */}
        {validationErrors.length > 0 && (
          <div className="bg-[#4D2628] border border-[#8C1D18] rounded-[24px] p-5 mb-4 animate-in fade-in">
            <p className="text-sm font-bold text-[#F2B8B5] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-[#F2B8B5]/80 space-y-1 ml-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 🚨 GEMINI TABS 🚨 */}
        <div className="border-b border-[#333538] overflow-x-auto no-scrollbar">
          <nav className="flex gap-2 min-w-max pb-px">
            {['basic', 'settings', 'seo'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize cursor-pointer ${
                  activeTab === tab
                    ? 'border-[#A8C7FA] text-[#A8C7FA]'
                    : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3] hover:border-[#565959]'
                }`}
              >
                {tab === 'basic' && 'Basic Info'}
                {tab === 'settings' && 'Settings'}
                {tab === 'seo' && 'SEO'}
              </button>
            ))}
          </nav>
        </div>

        {/* 🚨 BASIC INFO TAB 🚨 */}
        {activeTab === 'basic' && (
          <div className="space-y-6 animate-in fade-in">
            {initialData.updated_at && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#282A2C] text-[#C4C7C5] text-[11px] font-bold tracking-widest border border-[#333538]">
                LAST UPDATED: {formatIST(initialData.updated_at)}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Rigid Boxes"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="rigid-boxes"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Parent Category</label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                title="Select parent category"
                onChange={handleChange}
                className={`${inputClass} cursor-pointer appearance-none`}
              >
                <option value="" className="bg-[#1E1F20]">None (Top Level)</option>
                {categories.filter(c => c.id !== initialData.id).map(category => (
                  <option key={category.id} value={category.id} className="bg-[#1E1F20]">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Brief description of the category..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Elite Image Uploader */}
            <div>
              <label className={labelClass}>Category Thumbnail</label>
              
              <div className="mt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  title="Upload category thumbnail"
                  placeholder="Select image file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {(imagePreview || existingImageUrl) ? (
                  <div className="relative w-40 h-40 group">
                    <img
                      src={imagePreview || existingImageUrl || ''}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-[24px] border border-[#333538]"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-3 -right-3 bg-[#4D2628] border border-[#8C1D18] text-[#F2B8B5] rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-xl hover:bg-red-600 hover:text-white transition-all cursor-pointer z-10"
                    >
                      ✕
                    </button>
                    <div className="absolute inset-0 rounded-[24px] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">Replace Image</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="border-2 border-dashed border-[#333538] bg-[#131314] rounded-[24px] p-8 text-center cursor-pointer hover:border-[#A8C7FA] transition-colors group"
                  >
                    <UploadCloud className="w-10 h-10 mx-auto text-[#565959] group-hover:text-[#A8C7FA] transition-colors mb-3" />
                    <p className="text-sm font-medium text-[#C4C7C5]">Click to upload thumbnail</p>
                    <p className="text-xs text-[#8E9196] mt-2">JPEG, PNG, WebP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 🚨 SETTINGS TAB 🚨 */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className={labelClass}>Low Stock Threshold Alert</label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                title="Low stock threshold"
                placeholder="10"
                onChange={handleChange}
                min="0"
                className={inputClass}
              />
              <p className="text-xs text-[#565959] mt-2 ml-1">Notify when products in this category drop below this count.</p>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-3 p-4 bg-[#131314] border border-[#333538] rounded-2xl cursor-pointer hover:border-[#A8C7FA] transition-colors">
                <input
                  type="checkbox"
                  name="is_active"
                  title="Toggle category visibility"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[#333538] bg-[#1E1F20] text-[#0B57D0] focus:ring-[#A8C7FA]"
                />
                <span className="text-sm font-medium text-[#E3E3E3]">Active (Visible in storefront menus)</span>
              </label>
            </div>
          </div>
        )}

        {/* 🚨 SEO TAB 🚨 */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className={labelClass}>Meta Title</label>
              <input
                type="text"
                name="meta_title"
                value={formData.meta_title || ''}
                onChange={handleChange}
                placeholder="Optimize for Google Search..."
                maxLength={60}
                className={inputClass}
              />
              <p className="text-xs text-[#565959] mt-2 ml-1">
                {formData.meta_title?.length || 0}/60 characters
              </p>
            </div>
            <div>
              <label className={labelClass}>Meta Description</label>
              <textarea
                name="meta_description"
                value={formData.meta_description || ''}
                onChange={handleChange}
                placeholder="Compelling description to drive clicks..."
                rows={4}
                maxLength={160}
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-[#565959] mt-2 ml-1">
                {formData.meta_description?.length || 0}/160 characters
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#333538]">
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="w-full py-4 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            {isLoading ? 'Processing...' : initialData.id ? 'Save Category Settings' : 'Create Category'}
          </button>
        </div>
      </form>

      {/* 🚨 REUSABLE ELITE MODAL FOR SAVING 🚨 */}
      <AdminConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Deploy Changes?"
        description={`You are about to ${initialData.id ? 'update' : 'create'} this category in the live database.`}
        confirmText="Confirm Deployment"
        icon={<CheckCircle2 className="w-6 h-6" />}
        isLoading={isLoading}
      />
    </>
  )
}