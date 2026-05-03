// src/components/admin/ProductForm.tsx

'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { uploadProductImage, deleteProductImage, getPublicUrl } from '@/lib/supabase/storage'
import { showToast } from '@/components/ui/Toast' // 🚨 Utilizing Global Toast
import { PRODUCT_STATUS_FILTERS } from '@/lib/constants' // 🚨 DRY Architecture
import { UploadCloud, X, AlertTriangle, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date).toUpperCase()
}

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
  if (data.rating !== null && data.rating !== undefined) {
    if (data.rating < 0 || data.rating > 5) errors.push('Rating must be between 0.0 and 5.0')
  }
  if (data.review_count !== null && data.review_count !== undefined) {
    if (data.review_count < 0) errors.push('Review count cannot be negative')
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens')
  }
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
  const { isSuperAdmin } = useAuth()

  const [initialFormData] = useState<ProductFormData>({
    name: initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    price: initialData.price || 0,
    selling_price: initialData.selling_price || 0,
    bulk_price: initialData.bulk_price || null,
    bulk_min_quantity: initialData.bulk_min_quantity || null,
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
  
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'inventory' | 'seo' | 'bundles'>('basic')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bundleSearch, setBundleSearch] = useState('')

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) || newImageFiles.length > 0

  useEffect(() => {
    const loadExistingUrls = () => {
      const urls = new Map<string, string>()
      for (const path of formData.images) {
        const publicUrl = getPublicUrl(path)
        urls.set(path, publicUrl)
      }
      setExistingImageUrls(urls)
    }
    if (formData.images.length > 0) loadExistingUrls()
  }, [formData.images])

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
    const parsed = parseFloat(value)
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(parsed) ? (['price', 'stock', 'selling_price'].includes(name) ? 0 : null) : parsed,
    }))
  }

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: parseFloat(value) || 0 }
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (formData.images.length + newImageFiles.length + files.length > MAX_IMAGES) {
      showToast(`Maximum ${MAX_IMAGES} images allowed`, 'error')
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) errors.push(`${file.name}: Invalid format`)
      else if (file.size > MAX_FILE_SIZE) errors.push(`${file.name}: Exceeds 5MB`)
      else validFiles.push(file)
    })

    if (errors.length > 0) showToast(errors.join(', '), 'error')

    if (validFiles.length > 0) {
      setNewImageFiles(prev => [...prev, ...validFiles])
      setNewImagePreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))])
      showToast(`${validFiles.length} image(s) added`, 'success')
    }
  }

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updated = [...formData.images]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    setFormData(prev => ({ ...prev, images: updated }))
  }

  const handleDeleteExistingImage = async () => {
    if (!deleteConfirmPath) return
    try {
      await deleteProductImage(deleteConfirmPath)
      setFormData(prev => ({ ...prev, images: prev.images.filter(p => p !== deleteConfirmPath) }))
      setExistingImageUrls(prev => {
        const newMap = new Map(prev)
        newMap.delete(deleteConfirmPath)
        return newMap
      })
      showToast('Image deleted successfully', 'success')
    } catch (error) {
      showToast('Failed to delete image', 'error')
    } finally {
      setDeleteConfirmPath(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        uploadedPaths = await Promise.all(newImageFiles.map(file => uploadProductImage(file)))
      } catch (error) {
        showToast('Failed to upload images', 'error')
        return
      }
    }

    try {
      await onSubmit({
        ...formData,
        images: [...formData.images, ...uploadedPaths],
        dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) ? formData.dimensions : null as any,
      })
      setNewImageFiles([])
      newImagePreviews.forEach(URL.revokeObjectURL)
      setNewImagePreviews([])
    } catch (error) {
      showToast('Failed to save product', 'error')
    }
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
              {validationErrors.map((error, idx) => <li key={idx}>{error}</li>)}
            </ul>
          </div>
        )}

        {/* 🚨 GEMINI TABS 🚨 */}
        <div className="border-b border-[#333538] overflow-x-auto overscroll-contain-x no-scrollbar">
          <nav className="flex gap-2 min-w-max pb-px">
            {['basic', 'images', 'inventory', 'seo', 'bundles'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'border-[#A8C7FA] text-[#A8C7FA]'
                    : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3] hover:border-[#565959]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* 🚨 BASIC INFO 🚨 */}
        {activeTab === 'basic' && (
          <div className="space-y-6 animate-in fade-in">
            {initialData.updated_at && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#282A2C] text-[#C4C7C5] text-[11px] font-bold tracking-widest border border-[#333538]">
                LAST UPDATED: {formatIST(initialData.updated_at)}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="product-name" className={labelClass}>Product Name *</label>
                <input id="product-name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Rigid Box" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="product-slug" className={labelClass}>Slug *</label>
                <input id="product-slug" type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="rigid-box" required className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="product-description" className={labelClass}>Description</label>
              <textarea id="product-description" name="description" value={formData.description || ''} onChange={handleChange} placeholder="Detailed product specifications..." rows={4} className={`${inputClass} resize-none`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="product-category" className={labelClass}>Category</label>
                <select id="product-category" name="category_id" title="Select Product Category" value={formData.category_id || ''} onChange={handleChange} className={`${inputClass} cursor-pointer appearance-none`}>
                  <option value="" className="bg-[#1E1F20]">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id} className="bg-[#1E1F20]">{c.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="product-status" className={labelClass}>Status</label>
                <select id="product-status" name="status" title="Select Product Status" value={formData.status} onChange={handleChange} className={`${inputClass} cursor-pointer appearance-none`}>
                  {PRODUCT_STATUS_FILTERS.filter(f => f.value !== 'all').map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-[#131314] border border-[#333538] rounded-2xl cursor-pointer hover:border-[#A8C7FA] transition-colors">
              <input type="checkbox" name="is_featured" title="Featured Product" aria-label="Featured Product" checked={formData.is_featured} onChange={handleChange} className="w-5 h-5 rounded border-[#333538] bg-[#1E1F20] text-[#0B57D0] focus:ring-[#A8C7FA]" />
              <span className="text-sm font-medium text-[#E3E3E3]">Featured Product (Show on Storefront Homepage)</span>
            </label>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-[#333538]">
              <div>
                <label htmlFor="product-price" className={labelClass}>M.R.P (₹) *</label>
                <input id="product-price" type="number" name="price" value={formData.price} onChange={handleNumberChange} required min="0" step="0.01" className={inputClass} />
              </div>
              <div>
                <label htmlFor="product-selling_price" className={labelClass}>Selling Price (₹) *</label>
                <input id="product-selling_price" type="number" name="selling_price" value={formData.selling_price || ''} onChange={handleNumberChange} required min="0" step="0.01" className={inputClass} />
              </div>
            </div>

            {/* 🚨 B2B WHOLESALE (Dark Mode Accent) 🚨 */}
            <div className="mt-2 bg-[#0B57D0]/5 border border-[#0B57D0]/20 rounded-[24px] p-5 sm:p-6 shadow-sm">
              <h4 className="text-sm font-bold text-[#A8C7FA] mb-1 tracking-wide">B2B Wholesale Rules</h4>
              <p className="text-xs text-[#A8C7FA]/70 mb-5 leading-relaxed">Auto-apply discounts for high-volume manufacturing orders.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="product-bulk_price" className="block text-[11px] font-bold text-[#A8C7FA] mb-1.5 uppercase tracking-wider ml-1">Wholesale Price (₹)</label>
                  <input id="product-bulk_price" type="number" name="bulk_price" value={formData.bulk_price || ''} onChange={handleNumberChange} min="0" step="0.01" className="w-full px-4 py-3 bg-[#131314] border border-[#0B57D0]/30 text-[#E3E3E3] rounded-2xl focus:outline-none focus:border-[#A8C7FA] transition-colors" />
                </div>
                <div>
                  <label htmlFor="product-bulk_min_quantity" className="block text-[11px] font-bold text-[#A8C7FA] mb-1.5 uppercase tracking-wider ml-1">Min. Quantity Required</label>
                  <input id="product-bulk_min_quantity" type="number" name="bulk_min_quantity" value={formData.bulk_min_quantity || ''} onChange={handleNumberChange} min="1" step="1" className="w-full px-4 py-3 bg-[#131314] border border-[#0B57D0]/30 text-[#E3E3E3] rounded-2xl focus:outline-none focus:border-[#A8C7FA] transition-colors" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-[#333538]">
              <div>
                <label htmlFor="product-rating" className={labelClass}>Manual Rating (0 - 5.0)</label>
                <input id="product-rating" type="number" name="rating" value={formData.rating ?? ''} onChange={handleNumberChange} min="0" max="5" step="0.1" className={inputClass} />
              </div>
              <div>
                <label htmlFor="product-review_count" className={labelClass}>Manual Reviews Count</label>
                <input id="product-review_count" type="number" name="review_count" value={formData.review_count ?? ''} onChange={handleNumberChange} min="0" step="1" className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* 🚨 IMAGES TAB 🚨 */}
        {activeTab === 'images' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-[#E3E3E3]">
                Gallery <span className="text-[#8E9196]">({formData.images.length + newImageFiles.length} / {MAX_IMAGES})</span>
              </label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-2 text-sm font-bold bg-[#282A2C] hover:bg-[#333538] text-[#E3E3E3] rounded-full transition-colors cursor-pointer w-full sm:w-auto">
                Select Files
              </button>
            </div>

            <input ref={fileInputRef} type="file" title="Upload product images" aria-label="Upload product images" multiple accept={ALLOWED_FILE_TYPES.join(',')} onChange={handleFileSelect} className="hidden" />

            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#333538] bg-[#131314] rounded-[24px] p-8 sm:p-12 text-center cursor-pointer hover:border-[#A8C7FA] transition-colors group">
              <UploadCloud className="w-10 h-10 mx-auto text-[#565959] group-hover:text-[#A8C7FA] transition-colors mb-3" />
              <p className="text-sm font-medium text-[#C4C7C5]">Click or drag images to upload</p>
              <p className="text-xs text-[#8E9196] mt-2">JPEG, PNG, WebP up to 5MB</p>
            </div>

            {/* Previews logic remains structurally similar, just updated colors */}
            {(newImagePreviews.length > 0 || formData.images.length > 0) && (
              <div className="space-y-5 pt-4">
                {newImagePreviews.length > 0 && (
                  <div>
                     <p className={labelClass}>Ready to Upload</p>
                     <div className="flex flex-wrap gap-4">
                        {newImagePreviews.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`New upload preview ${idx + 1}`} title={`New upload preview ${idx + 1}`} className="w-24 h-24 object-cover rounded-2xl border border-[#333538]" />
                            <button type="button" onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg hover:bg-red-600 transition-transform hover:scale-110 cursor-pointer">✕</button>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
                {formData.images.length > 0 && (
                  <div>
                    <p className={labelClass}>Current Gallery (Drag to Reorder)</p>
                    <div className="flex flex-wrap gap-4">
                      {formData.images.map((path, idx) => {
                        const publicUrl = existingImageUrls.get(path)
                        return (
                          <div key={path} className="relative group cursor-move" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', idx.toString())} onDrop={(e) => { e.preventDefault(); reorderImages(parseInt(e.dataTransfer.getData('text/plain')), idx); }} onDragOver={(e) => e.preventDefault()}>
                            {publicUrl ? <img src={publicUrl} alt={`Product image ${idx + 1}`} title={`Product image ${idx + 1}`} className="w-24 h-24 object-cover rounded-2xl border border-[#333538] opacity-90 group-hover:opacity-100 transition-opacity" /> : <div className="w-24 h-24 bg-[#131314] rounded-2xl flex items-center justify-center border border-[#333538]"><ImageIcon className="w-6 h-6 text-[#565959] animate-pulse" /></div>}
                            {isSuperAdmin ? (
                              <button type="button" onClick={() => setDeleteConfirmPath(path)} className="absolute -top-2 -right-2 bg-[#4D2628] border border-[#8C1D18] text-[#F2B8B5] rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg hover:bg-red-600 hover:text-white transition-all cursor-pointer z-10">✕</button>
                            ) : (
                              <div className="absolute -top-2 -right-2 bg-[#131314] border border-[#333538] text-[#8E9196] rounded-full w-7 h-7 flex items-center justify-center text-xs z-10">🔒</div>
                            )}
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{idx + 1}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 🚨 INVENTORY TAB 🚨 */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="product-sku" className={labelClass}>SKU / Barcode</label>
                <input id="product-sku" type="text" name="sku" value={formData.sku || ''} onChange={handleChange} placeholder="e.g. BOX-RG-01" className={inputClass} />
              </div>
              <div>
                <label htmlFor="product-stock" className={labelClass}>Stock Quantity *</label>
                <input id="product-stock" type="number" name="stock" value={formData.stock} onChange={handleNumberChange} required min="0" className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="product-weight" className={labelClass}>Weight (kg)</label>
              <input id="product-weight" type="number" name="weight" value={formData.weight || ''} onChange={handleNumberChange} step="0.01" min="0" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Shipping Dimensions (cm)</label>
              <div className="grid grid-cols-3 gap-3">
                <input aria-label="Length" title="Length" type="number" placeholder="Length" value={formData.dimensions.length || ''} onChange={(e) => handleDimensionChange('length', e.target.value)} className={inputClass} />
                <input aria-label="Width" title="Width" type="number" placeholder="Width" value={formData.dimensions.width || ''} onChange={(e) => handleDimensionChange('width', e.target.value)} className={inputClass} />
                <input aria-label="Height" title="Height" type="number" placeholder="Height" value={formData.dimensions.height || ''} onChange={(e) => handleDimensionChange('height', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* 🚨 SEO TAB 🚨 */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label htmlFor="product-meta_title" className={labelClass}>Meta Title</label>
              <input id="product-meta_title" type="text" name="meta_title" value={formData.meta_title || ''} onChange={handleChange} placeholder="Optimize for search engines..." maxLength={60} className={inputClass} />
              <p className="text-xs text-[#565959] mt-2 ml-1">{formData.meta_title?.length || 0}/60 chars</p>
            </div>
            <div>
              <label htmlFor="product-meta_description" className={labelClass}>Meta Description</label>
              <textarea id="product-meta_description" name="meta_description" value={formData.meta_description || ''} onChange={handleChange} placeholder="A short, compelling description for Google search results..." rows={4} maxLength={160} className={`${inputClass} resize-none`} />
              <p className="text-xs text-[#565959] mt-2 ml-1">{formData.meta_description?.length || 0}/160 chars</p>
            </div>
          </div>
        )}

        {/* 🚨 BUNDLES TAB 🚨 */}
        {activeTab === 'bundles' && (
          <div className="space-y-4 animate-in fade-in">
            <label className={labelClass}>Frequently Bought Together</label>
            <p className="text-xs text-[#8E9196] mb-4">Select items to display in the "Customers also bought" section.</p>
            
            <div className="border border-[#333538] rounded-[24px] overflow-hidden flex flex-col h-[350px] bg-[#1E1F20]">
              <div className="p-3 border-b border-[#333538] bg-[#131314]">
                <input type="text" placeholder="Search catalog..." title="Search catalog" value={bundleSearch} onChange={(e) => setBundleSearch(e.target.value)} className="w-full px-4 py-2.5 bg-[#1E1F20] border border-[#333538] rounded-xl text-sm focus:outline-none focus:border-[#A8C7FA] text-[#E3E3E3]" aria-label="Search for products to bundle" />
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-2 no-scrollbar">
                {allProducts.filter(p => p.id !== initialData?.id && p.name.toLowerCase().includes(bundleSearch.toLowerCase())).map(p => {
                  const isSelected = formData.frequently_bought_together.includes(p.id)
                  return (
                    <label key={p.id} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors border ${isSelected ? 'bg-[#0B57D0]/10 border-[#0B57D0]/30' : 'hover:bg-[#282A2C] border-transparent'}`}>
                      <input type="checkbox" title={`Select ${p.name}`} aria-label={`Select ${p.name}`} checked={isSelected} onChange={(e) => { const c = e.target.checked; setFormData(prev => ({ ...prev, frequently_bought_together: c ? [...prev.frequently_bought_together, p.id] : prev.frequently_bought_together.filter(id => id !== p.id) })) }} className="w-5 h-5 rounded border-[#333538] bg-[#131314] text-[#0B57D0] focus:ring-[#A8C7FA]" />
                      <span className={`text-sm select-none flex-1 ${isSelected ? 'text-[#A8C7FA] font-medium' : 'text-[#C4C7C5]'}`}>{p.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#333538]">
          <button type="submit" disabled={isLoading || !isDirty} className="w-full py-4 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-900/20 active:scale-[0.98]">
            {isLoading ? 'Processing...' : 'Save Product Configuration'}
          </button>
        </div>
      </form>

      {/* 🚨 GEMINI INLINE MODALS 🚨 */}
      
      {/* Delete Image Confirm */}
      {deleteConfirmPath && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-7 md:p-8 max-w-sm w-full animate-in zoom-in-95 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#4D2628] border border-[#8C1D18] text-[#F2B8B5] rounded-full flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-[#E3E3E3] mb-2">Delete Image?</h3>
            <p className="text-sm text-[#C4C7C5] mb-8 leading-relaxed">This permanently removes the image from cloud storage.</p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleDeleteExistingImage} className="w-full py-3.5 bg-[#B3261E] text-white font-bold rounded-full hover:bg-[#8C1D18] transition-colors cursor-pointer">Delete Permanently</button>
              <button onClick={() => setDeleteConfirmPath(null)} className="w-full py-3.5 border border-[#333538] text-[#E3E3E3] hover:bg-[#282A2C] font-medium rounded-full transition-colors cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Save Product Confirm */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E1F20] border border-[#333538] rounded-[32px] p-7 md:p-8 max-w-sm w-full animate-in zoom-in-95 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#0B57D0]/20 border border-[#0B57D0]/40 text-[#A8C7FA] rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-[#E3E3E3] mb-2">Deploy Changes?</h3>
            <p className="text-sm text-[#C4C7C5] mb-8 leading-relaxed">You are about to {initialData.id ? 'update' : 'create'} this product in the live database.</p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleConfirmSave} className="w-full py-3.5 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-colors cursor-pointer shadow-lg shadow-blue-900/20">Confirm Deployment</button>
              <button onClick={() => setShowSaveConfirm(false)} className="w-full py-3.5 border border-[#333538] text-[#E3E3E3] hover:bg-[#282A2C] font-medium rounded-full transition-colors cursor-pointer">Review Again</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}