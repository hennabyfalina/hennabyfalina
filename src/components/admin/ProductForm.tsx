// src/components/admin/ProductForm.tsx

'use client'

import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { uploadProductImage, deleteProductImage, getPublicUrl } from '@/lib/supabase/storage'
import { showToast } from '@/components/ui/Toast' 
import { UploadCloud, AlertTriangle, CheckCircle2, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ProductFormData {
  name: string
  slug: string
  description: string | null
  mrp: number | string
  retail_price: number | string 
  wholesale_price: number | string 
  wholesale_min_qty: number | string
  stock: number | string
  sku: string | null
  category_id: string | null
  images: string[]
  is_active: boolean
  is_featured: boolean
  weight: number | string | null
  weight_unit?: 'kg' | 'g'
  gsm?: number | string | null
  dimensions: { length: number | string; width: number | string; height: number | string }
  updated_at?: string
  meta_title?: string | null
  meta_description?: string | null
  rating?: number | string | null
  review_count?: number | string | null
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
const MAX_FILE_SIZE = 5 * 1024 * 1024

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
  if (data.stock === '' || Number(data.stock) < 0) errors.push('Stock cannot be negative')
  if (data.retail_price === '' || Number(data.retail_price) <= 0) errors.push('Retail price must be greater than 0')
  if (data.mrp !== '' && Number(data.mrp) > 0 && Number(data.mrp) < Number(data.retail_price)) errors.push('MRP cannot be lower than Retail price')
  if (data.wholesale_price !== '' && Number(data.wholesale_price) > Number(data.retail_price)) errors.push('Wholesale price cannot be higher than Retail price')
  
  if (data.rating !== '' && data.rating !== null && data.rating !== undefined) {
    if (Number(data.rating) < 0 || Number(data.rating) > 5) errors.push('Rating must be between 0.0 and 5.0')
  }
  if (data.review_count !== '' && data.review_count !== null && data.review_count !== undefined) {
    if (Number(data.review_count) < 0) errors.push('Review count cannot be negative')
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens')
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
    mrp: initialData.mrp || '',
    retail_price: initialData.retail_price || '', 
    wholesale_price: initialData.wholesale_price || '', 
    wholesale_min_qty: initialData.wholesale_min_qty || 1,
    stock: initialData.stock === 0 ? '' : (initialData.stock || ''),
    sku: initialData.sku || null,
    category_id: initialData.category_id || null,
    images: initialData.images || [],
    is_active: initialData.is_active ?? true,
    is_featured: initialData.is_featured ?? false,
    weight: initialData.weight === 0 ? '' : (initialData.weight || ''),
    weight_unit: (initialData.weight_unit as string === 'g' || initialData.weight_unit as string === 'gram') ? 'g' : 'kg',
    gsm: initialData.gsm === 0 ? '' : (initialData.gsm || ''),
    dimensions: { 
      length: initialData.dimensions?.length ?? '', 
      width: initialData.dimensions?.width ?? '', 
      height: initialData.dimensions?.height ?? '' 
    },
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
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value),
    }))
  }

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value === '' ? '' : parseFloat(value) }
    }))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (formData.images.length + newImageFiles.length + files.length > MAX_IMAGES) {
      showToast(`Maximum ${MAX_IMAGES} images allowed`, 'error')
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) errors.push(`${file.name}: Invalid format`)
      else if (file.size > MAX_FILE_SIZE) errors.push(`${file.name}: Exceeds 5MB`)
      else {
        validFiles.push(file)
      }
    }

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

  const handleSubmitForm = async (e: React.FormEvent) => {
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
        mrp: Number(formData.mrp) || 0,
        retail_price: Number(formData.retail_price) || 0, 
        wholesale_price: Number(formData.wholesale_price) || 0, 
        wholesale_min_qty: Number(formData.wholesale_min_qty) || 1,
        stock: formData.stock === '' ? 0 : Number(formData.stock),
        weight: formData.weight === '' || formData.weight === null ? null : Number(formData.weight),
        weight_unit: formData.weight_unit || 'kg',
        gsm: formData.gsm === '' || formData.gsm === null ? null : Number(formData.gsm),
        is_featured: formData.is_featured ?? false,
        rating: formData.rating === '' || formData.rating === null ? null : Number(formData.rating),
        review_count: formData.review_count === '' || formData.review_count === null ? null : Number(formData.review_count),
        dimensions: (formData.dimensions.length !== '' || formData.dimensions.width !== '' || formData.dimensions.height !== '') ? {
          length: Number(formData.dimensions.length) || 0,
          width: Number(formData.dimensions.width) || 0,
          height: Number(formData.dimensions.height) || 0,
        } : null as any,
        images: [...formData.images, ...uploadedPaths]
      })
      setNewImageFiles([])
      newImagePreviews.forEach(URL.revokeObjectURL)
      setNewImagePreviews([])
    } catch (error) {
      showToast('Failed to save product', 'error')
    }
  }

  const inputClass = "w-full px-4 py-3 admin-bg-primary border admin-border admin-text-primary placeholder:text-[#565959] rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all"
  const labelClass = "block text-[13px] font-medium admin-text-muted mb-1.5 ml-1 uppercase tracking-wider"

  return (
    <>
      <form onSubmit={handleSubmitForm} className="space-y-6 admin-text-primary">
        
        {validationErrors.length > 0 && (
          <div className="bg-red-100 dark:bg-[#4D2628] border border-red-300 dark:border-[#8C1D18] rounded-[24px] p-5 mb-4 animate-in fade-in">
            <p className="text-sm font-bold text-red-700 dark:text-[#F2B8B5] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-[#F2B8B5]/80 space-y-1 ml-1">
              {validationErrors.map((error, idx) => <li key={idx}>{error}</li>)}
            </ul>
          </div>
        )}

        <div className="border-b admin-border overflow-x-auto overscroll-contain-x no-scrollbar">
          <nav className="flex gap-2 min-w-max pb-px">
            {['basic', 'images', 'inventory', 'seo', 'bundles'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'border-[#A8C7FA] text-[#A8C7FA]'
                    : 'border-transparent admin-text-muted hover:admin-text-primary hover:border-[#565959]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'basic' && (
          <div className="space-y-6 animate-in fade-in">
            {initialData.updated_at && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full admin-bg-elevated admin-text-secondary text-[11px] font-bold tracking-widest border admin-border">
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
                  <option value="" className="admin-bg-card">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id} className="admin-bg-card">{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-3 pt-1">
                <label className="flex items-center gap-3 p-3 admin-bg-primary border admin-border rounded-2xl cursor-pointer hover:border-[#A8C7FA] transition-colors">
                  <input type="checkbox" name="is_active" title="Active Status" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 rounded admin-border admin-bg-card text-[#0B57D0] focus:ring-[#A8C7FA]" />
                  <span className="text-sm font-medium admin-text-primary">Active (Visible in store)</span>
                </label>
                <label className="flex items-center gap-3 p-3 admin-bg-primary border admin-border rounded-2xl cursor-pointer hover:border-[#A8C7FA] transition-colors">
                  <input type="checkbox" name="is_featured" title="Featured Product" checked={formData.is_featured} onChange={handleChange} className="w-5 h-5 rounded admin-border admin-bg-card text-[#0B57D0] focus:ring-[#A8C7FA]" />
                  <span className="text-sm font-medium admin-text-primary">Featured (Show on Homepage)</span>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t admin-border">
              <div className="mb-6">
                <h4 className="text-base font-medium admin-text-primary tracking-wide">Hybrid Pricing Strategy</h4>
                <p className="text-xs admin-text-muted mt-1">Set standard retail and bulk wholesale rates.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label htmlFor="mrp" className={labelClass}>MRP (₹)</label>
                  <input id="mrp" type="number" name="mrp" value={formData.mrp} onChange={handleNumberChange} placeholder="0.00" step="0.01" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="retail_price" className={labelClass}>Selling Price (₹) *</label>
                  <input id="retail_price" type="number" name="retail_price" value={formData.retail_price} onChange={handleNumberChange} placeholder="0.00" step="0.01" required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="wholesale_price" className={labelClass}>Wholesale Price (₹)</label>
                  <input id="wholesale_price" type="number" name="wholesale_price" value={formData.wholesale_price} onChange={handleNumberChange} placeholder="0.00" step="0.01" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="wholesale_min_qty" className={labelClass}>Wholesale Min Qty</label>
                  <input id="wholesale_min_qty" type="number" name="wholesale_min_qty" value={formData.wholesale_min_qty} onChange={handleNumberChange} placeholder="1" min="1" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t admin-border">
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

        {activeTab === 'images' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <label className="text-sm font-medium admin-text-primary">
                Gallery <span className="admin-text-muted">({formData.images.length + newImageFiles.length} / {MAX_IMAGES})</span>
              </label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-2 text-sm font-bold admin-bg-elevated hover:admin-bg-hover admin-text-primary rounded-full transition-colors cursor-pointer w-full sm:w-auto">
                Select Files
              </button>
            </div>

            <input ref={fileInputRef} type="file" title="Upload product images" aria-label="Upload product images" multiple accept={ALLOWED_FILE_TYPES.join(',')} onChange={handleFileSelect} className="hidden" />

            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed admin-border admin-bg-primary rounded-[24px] p-8 sm:p-12 text-center cursor-pointer hover:border-[#A8C7FA] transition-colors group">
              <UploadCloud className="w-10 h-10 mx-auto text-[#565959] group-hover:text-[#A8C7FA] transition-colors mb-3" />
              <p className="text-sm font-medium admin-text-secondary">Click or drag images to upload</p>
              <p className="text-xs admin-text-muted mt-2">JPEG, PNG, WebP up to 5MB</p>
            </div>

            {(newImagePreviews.length > 0 || formData.images.length > 0) && (
              <div className="space-y-5 pt-4">
                {newImagePreviews.length > 0 && (
                  <div>
                     <p className={labelClass}>Ready to Upload</p>
                     <div className="flex flex-wrap gap-4">
                        {newImagePreviews.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`New upload preview ${idx + 1}`} title={`New upload preview ${idx + 1}`} className="w-24 h-24 object-cover rounded-2xl border admin-border" />
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
                            {publicUrl ? <img src={publicUrl} alt={`Product image ${idx + 1}`} title={`Product image ${idx + 1}`} className="w-24 h-24 object-cover rounded-2xl border admin-border opacity-90 group-hover:opacity-100 transition-opacity" /> : <div className="w-24 h-24 admin-bg-primary rounded-2xl flex items-center justify-center border admin-border"><ImageIcon className="w-6 h-6 text-[#565959] animate-pulse" /></div>}
                            <button type="button" onClick={() => setDeleteConfirmPath(path)} className="absolute -top-2 -right-2 bg-red-100 dark:bg-[#4D2628] border border-red-300 dark:border-[#8C1D18] text-red-600 dark:text-[#F2B8B5] rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer z-10">✕</button>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="product-weight" className={labelClass}>Weight</label>
                <div className="flex gap-2">
                  <input id="product-weight" type="number" name="weight" value={formData.weight ?? ''} onChange={handleNumberChange} step="0.01" min="0" className={inputClass} placeholder="0.00" />
                  <select name="weight_unit" title="Weight Unit" value={formData.weight_unit || 'kg'} onChange={handleChange} className={`${inputClass} w-24 px-2 cursor-pointer appearance-none`}>
                    <option value="kg" className="admin-bg-card">kg</option>
                    <option value="g" className="admin-bg-card">g</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="product-gsm" className={labelClass}>GSM (Thickness)</label>
                <input id="product-gsm" type="number" name="gsm" value={formData.gsm ?? ''} onChange={handleNumberChange} step="1" min="0" className={inputClass} placeholder="e.g. 350" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Shipping Dimensions (cm)</label>
              <div className="grid grid-cols-3 gap-3">
                <input aria-label="Length" title="Length" type="number" placeholder="Length" value={formData.dimensions.length ?? ''} onChange={(e) => handleDimensionChange('length', e.target.value)} className={inputClass} />
                <input aria-label="Width" title="Width" type="number" placeholder="Width" value={formData.dimensions.width ?? ''} onChange={(e) => handleDimensionChange('width', e.target.value)} className={inputClass} />
                <input aria-label="Height" title="Height" type="number" placeholder="Height" value={formData.dimensions.height ?? ''} onChange={(e) => handleDimensionChange('height', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        )}

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

        {activeTab === 'bundles' && (
          <div className="space-y-4 animate-in fade-in">
            <label className={labelClass}>Frequently Bought Together</label>
            <p className="text-xs admin-text-muted mb-4">Select items to display in the &apos;Customers also bought&apos; section.</p>
            
            <div className="border admin-border rounded-[24px] overflow-hidden flex flex-col h-[350px] admin-bg-card">
              <div className="p-3 border-b admin-border admin-bg-primary">
                <input type="text" placeholder="Search catalog..." title="Search catalog" value={bundleSearch} onChange={(e) => setBundleSearch(e.target.value)} className="w-full px-4 py-2.5 admin-bg-card border admin-border rounded-xl text-sm focus:outline-none focus:border-[#A8C7FA] admin-text-primary" aria-label="Search for products to bundle" />
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-2 no-scrollbar">
                {allProducts.filter(p => p.id !== initialData?.id && p.name.toLowerCase().includes(bundleSearch.toLowerCase())).map(p => {
                  const isSelected = formData.frequently_bought_together.includes(p.id)
                  return (
                    <label key={p.id} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors border ${isSelected ? 'bg-[#0B57D0]/10 border-[#0B57D0]/30' : 'hover:admin-bg-elevated border-transparent'}`}>
                      <input type="checkbox" title={`Select ${p.name}`} aria-label={`Select ${p.name}`} checked={isSelected} onChange={(e) => { const c = e.target.checked; setFormData(prev => ({ ...prev, frequently_bought_together: c ? [...prev.frequently_bought_together, p.id] : prev.frequently_bought_together.filter(id => id !== p.id) })) }} className="w-5 h-5 rounded admin-border admin-bg-primary text-[#0B57D0] focus:ring-[#A8C7FA]" />
                      <span className={`text-sm select-none flex-1 ${isSelected ? 'text-[#A8C7FA] font-medium' : 'admin-text-secondary'}`}>{p.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t admin-border">
          <button type="submit" disabled={isLoading || !isDirty} className="w-full py-4 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-900/20 active:scale-[0.98]">
            {isLoading ? 'Processing...' : 'Save Product Configuration'}
          </button>
        </div>
      </form>

      {deleteConfirmPath && createPortal(
        <div className="z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
          <div className="admin-bg-card border admin-border rounded-[32px] p-7 md:p-8 max-w-sm w-full animate-in zoom-in-95 text-center flex flex-col items-center z-10">
            <div className="w-14 h-14 bg-red-100 dark:bg-[#4D2628] border border-red-300 dark:border-[#8C1D18] text-red-600 dark:text-[#F2B8B5] rounded-full flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium admin-text-primary mb-2">Delete Image?</h3>
            <p className="text-sm admin-text-secondary mb-8 leading-relaxed">This permanently removes the image from cloud storage.</p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleDeleteExistingImage} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors cursor-pointer">Delete Permanently</button>
              <button onClick={() => setDeleteConfirmPath(null)} className="w-full py-3.5 border admin-border admin-text-primary hover:admin-bg-elevated font-medium rounded-full transition-colors cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSaveConfirm && createPortal(
        <div className="z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
          <div className="admin-bg-card border admin-border rounded-[32px] p-7 md:p-8 max-w-sm w-full animate-in zoom-in-95 text-center flex flex-col items-center z-10">
            <div className="w-14 h-14 bg-[#0B57D0]/20 border border-[#0B57D0]/40 text-[#A8C7FA] rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium admin-text-primary mb-2">Deploy Changes?</h3>
            <p className="text-sm admin-text-secondary mb-8 leading-relaxed">You are about to {initialData.id ? 'update' : 'create'} this product in the live database.</p>
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleConfirmSave} className="w-full py-3.5 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-colors cursor-pointer shadow-lg shadow-blue-900/20">Confirm Deployment</button>
              <button onClick={() => setShowSaveConfirm(false)} className="w-full py-3.5 border admin-border admin-text-primary hover:admin-bg-elevated font-medium rounded-full transition-colors cursor-pointer">Review Again</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}