// src/components/admin/CategoryForm.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { uploadProductImage, deleteProductImage, getPublicUrl } from '@/lib/supabase/storage'
import { showToast } from '@/components/ui/Toast'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { UploadCloud, AlertTriangle, CheckCircle2, Image as ImageIcon, RotateCcw, Sliders, Star } from 'lucide-react'

interface CategoryFormData {
  name: string
  slug: string
  description: string | null
  image: string | null
  parent_id: string | null
  is_active: boolean
  is_featured: boolean // 🏛️ ADDED ADAPTIVE FLAG
  type: string | null   // 🏛️ ADDED CLASSIFICATION KEY
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

const validateCategory = (data: CategoryFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (!data.name.trim()) errors.push('Category name is required')
  if (!data.slug.trim()) errors.push('Category slug is required')
  if (data.low_stock_threshold < 0) errors.push('Low stock threshold cannot be negative')
  if (!data.type) errors.push('Category system layout type selection is required')
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
    is_featured: initialData.is_featured ?? false, // Hydrate featured status
    type: initialData.type || 'shop',             // Auto-default to 'shop' to protect homepage visibility
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
  const [stagedDeletedImage, setStagedDeletedImage] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'basic' | 'settings' | 'seo'>('basic')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) || newImageFile !== null || stagedDeletedImage !== null

  useEffect(() => {
    const loadImage = async () => {
      if (formData.image && !formData.image.startsWith('http')) {
        const publicUrl = getPublicUrl(formData.image)
        setExistingImageUrl(publicUrl)
      } else if (formData.image) {
        setExistingImageUrl(formData.image)
      } else {
        setExistingImageUrl(null)
      }
    }
    loadImage()
  }, [formData.image])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseInt(value, 10),
    }))
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

    if (formData.image && !stagedDeletedImage) {
      setStagedDeletedImage(formData.image)
    }

    setNewImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormData(prev => ({ ...prev, image: null }))
    showToast('New image staged for update', 'info')
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    
    if (formData.image && !stagedDeletedImage) {
      setStagedDeletedImage(formData.image)
    } else if (initialFormData.image && !stagedDeletedImage) {
      setStagedDeletedImage(initialFormData.image)
    }

    setNewImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image: null }))
  }

  const resetImageToInitial = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setNewImageFile(null)
    setImagePreview(null)
    setStagedDeletedImage(null)
    setFormData(prev => ({ ...prev, image: initialFormData.image }))
    showToast('Image changes reverted back', 'info')
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
    let finalCloudPath = formData.image

    if (newImageFile) {
      try {
        showToast('Uploading new category image...', 'info')
        finalCloudPath = await uploadProductImage(newImageFile)
      } catch (error) {
        console.error('Image upload failed:', error)
        showToast('Failed to upload new image asset', 'error')
        return
      }
    }

    if (stagedDeletedImage && !stagedDeletedImage.startsWith('http')) {
      try {
        await deleteProductImage(stagedDeletedImage)
      } catch (err) {
        console.error('Failed to purge old asset from storage bucket:', err)
      }
    }

    await onSubmit({
      ...formData,
      image: finalCloudPath,
      parent_id: formData.parent_id === '' ? null : formData.parent_id,
      is_featured: formData.is_featured,
      type: formData.type,
      meta_title: formData.meta_title?.trim() || null,
      meta_description: formData.meta_description?.trim() || null,
      description: formData.description?.trim() || null,
    })

    setNewImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setStagedDeletedImage(null)
  }

  const inputClass = "w-full px-4 py-3 admin-bg-primary border border-solid admin-border admin-text-primary placeholder:admin-text-muted rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all text-sm font-medium"
  const labelClass = "block text-[11px] font-bold admin-text-muted mb-1.5 ml-1 uppercase tracking-widest"

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 admin-text-primary text-left select-none font-sans antialiased">
        
        {validationErrors.length > 0 && (
          <div className="bg-red-100 dark:bg-[#4D2628] border border-solid border-red-300 dark:border-[#8C1D18] rounded-[24px] p-5 mb-4 animate-in fade-in">
            <p className="text-sm font-bold text-red-700 dark:text-[#F2B8B5] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-[#F2B8B5]/80 space-y-1 ml-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-b border-solid admin-border overflow-x-auto no-scrollbar">
          <nav className="flex gap-2 min-w-max pb-px">
            {['basic', 'settings', 'seo'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer border-none bg-transparent outline-none ${
                  activeTab === tab
                    ? 'border-[#A8C7FA] text-[#A8C7FA]'
                    : 'border-transparent admin-text-muted hover:admin-text-primary hover:border-[#565959]'
                }`}
              >
                {tab === 'basic' && 'Basic Info'}
                {tab === 'settings' && 'Settings'}
                {tab === 'seo' && 'SEO'}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-6 animate-in fade-in">
            {initialData.updated_at && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full admin-bg-elevated admin-text-secondary text-[11px] font-bold tracking-widest border border-solid admin-border">
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
                <option value="" className="admin-bg-card">None (Top Level)</option>
                {categories.filter(c => c.id !== initialData.id).map(category => (
                  <option key={category.id} value={category.id} className="admin-bg-card">
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

                {(imagePreview || (existingImageUrl && !stagedDeletedImage)) ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative w-40 h-40 group cursor-pointer border border-solid admin-border rounded-[24px] overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                      <img
                        src={imagePreview || existingImageUrl || ''}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="absolute top-2 right-2 bg-red-100 dark:bg-[#4D2628] border border-solid border-red-300 dark:border-[#8C1D18] text-red-600 dark:text-[#F2B8B5] rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-xl hover:bg-red-600 hover:text-white transition-all cursor-pointer z-10 outline-none"
                      >
                        ✕
                      </button>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Replace Image</span>
                      </div>
                    </div>

                    {stagedDeletedImage && (
                      <button
                        type="button"
                        onClick={resetImageToInitial}
                        className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-amber-500 bg-amber-950/30 px-3 py-1.5 rounded-xl border border-solid border-amber-900/40 hover:bg-amber-950/60 transition-colors outline-none cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Undo / Revert Deletion
                      </button>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="border-2 border-dashed admin-border admin-bg-primary rounded-[24px] p-8 text-center cursor-pointer hover:border-[#A8C7FA] transition-colors group animate-in zoom-in-95 duration-150"
                  >
                    <UploadCloud className="w-10 h-10 mx-auto text-[#565959] group-hover:text-[#A8C7FA] transition-colors mb-3" />
                    <p className="text-sm font-medium admin-text-secondary">Click to upload thumbnail</p>
                    <p className="text-xs admin-text-muted mt-2">JPEG, PNG, WebP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            {/* 🏛️ FEATURE 1: ROUTING SEGMENT CLASSIFICATION DRAG ACCORDION */}
            <div>
              <label className={labelClass}>System Layout Type *</label>
              <select
                name="type"
                value={formData.type || ''}
                title="Select Category Classification"
                onChange={handleChange}
                className={`${inputClass} cursor-pointer appearance-none font-medium`}
                required
              >
                <option value="shop" className="admin-bg-card">Shop Category (Appears on Homepage Carousel)</option>
                <option value="blog" className="admin-bg-card">Blog / Editorial Cluster Node</option>
                <option value="hidden" className="admin-bg-card">Hidden Utility Matrix Link Block</option>
              </select>
              <p className="text-xs text-[#565959] mt-2 ml-1">
                Must be set explicitly to <span className="font-mono text-stone-400">Shop Category</span> to pass the index caching filters of your storefront homepage.
              </p>
            </div>

            <div>
              <label className={labelClass}>Low Stock Threshold Alert</label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                title="Low stock threshold"
                placeholder="10"
                onChange={handleNumberChange}
                min="0"
                step="1"
                className={inputClass}
              />
              <p className="text-xs text-[#565959] mt-2 ml-1">Notify when products in this category drop below this count.</p>
            </div>

            {/* 🏛️ FEATURE 2: TOGGLE AND FLAG CONFIGURATION LAYOUT CHECKS */}
            <div className="pt-4 space-y-4">
              <label className="flex items-center gap-3 p-4 admin-bg-primary border border-solid admin-border rounded-2xl cursor-pointer hover:border-[#A8C7FA] transition-colors">
                <input
                  type="checkbox"
                  name="is_active"
                  title="Toggle category visibility"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded admin-border admin-bg-card text-[#0B57D0] focus:ring-[#A8C7FA]"
                />
                <span className="text-sm font-medium admin-text-primary">Active (Visible in storefront menus)</span>
              </label>

              <label className="flex items-center gap-3 p-4 admin-bg-primary border border-solid admin-border rounded-2xl cursor-pointer hover:border-emerald-500 transition-colors group">
                <input
                  type="checkbox"
                  name="is_featured"
                  title="Toggle featured status"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-5 h-5 rounded admin-border admin-bg-card text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-1.5 text-sm font-medium admin-text-primary group-hover:text-emerald-400 transition-colors">
                  <Star className={`w-4 h-4 ${formData.is_featured ? 'fill-emerald-500 text-emerald-500' : 'text-[#565959]'}`} />
                  <span>Featured Hierarchy (Highlight / Prioritize across custom components)</span>
                </div>
              </label>
            </div>
          </div>
        )}

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
              <p className="text-xs text-[#565959] mt-2 ml-1 font-mono">
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
              <p className="text-xs text-[#565959] mt-2 ml-1 font-mono">
                {formData.meta_description?.length || 0}/160 characters
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-solid admin-border">
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="w-full py-4 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-900/20 active:scale-[0.98] border-none outline-none"
          >
            {isLoading ? 'Processing...' : initialData.id ? 'Save Category Settings' : 'Create Category'}
          </button>
        </div>
      </form>

      <AdminConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Deploy Changes?"
        description={
          <div className="space-y-3 text-left">
            <p className="text-sm admin-text-secondary leading-relaxed">
              You are about to deploy this category configuration to the live database.
            </p>
            {stagedDeletedImage && (
              <p className="text-xs font-semibold text-red-400 bg-red-950/30 border border-solid border-red-900/40 p-3 rounded-xl flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Warning: Staged old cloud thumbnail asset will be permanently erased.
              </p>
            )}
          </div>
        }
        confirmText="Confirm Deployment"
        icon={<CheckCircle2 className="w-6 h-6" />}
        isLoading={isLoading}
      />
    </>
  )
}