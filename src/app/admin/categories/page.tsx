// src/app/admin/categories/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { 
  getCategoriesWithCounts, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  updateCategoryOrder,
  Category 
} from '@/services/category.service'
import Modal from '@/components/ui/Modal'
import CategoryForm from '@/components/admin/CategoryForm'
import StatsCard from '@/components/admin/StatsCard'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { showToast } from '@/components/ui/Toast'
import { Layers, CheckCircle, Package, GripVertical, Search, Filter, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

import { CATEGORY_SORT_OPTIONS } from '@/lib/constants'
import AdminCategoriesLoading from './loading'

const formatIST = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).toUpperCase()
}

export default function AdminCategories() {
  const { isSuperAdmin } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('display_order')

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCategoriesWithCounts()
      setCategories(data)
    } catch (error) {
      showToast('Failed to load categories', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
        showToast('Category updated successfully', 'success')
      } else {
        await createCategory(formData)
        showToast('Category created successfully', 'success')
      }
      await loadCategories()
      setIsModalOpen(false)
      setEditingCategory(null)
    } catch (error: any) {
      console.error('Save failed:', error)
      showToast(error.message || 'Failed to save category', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    setIsSubmitting(true)
    try {
      await deleteCategory(categoryToDelete.id)
      await loadCategories()
      showToast('Category permanently deleted', 'success')
      setCategoryToDelete(null)
    } catch (error: any) {
      console.error('Delete failed:', error)
      showToast(error.message || 'Failed to delete category', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(categories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setCategories(items)

    const orderedIds = items.map(item => item.id)
    try {
      await updateCategoryOrder(orderedIds)
    } catch (error) {
      showToast('Failed to save new order', 'error')
      loadCategories()
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'updated_desc') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    return a.display_order - b.display_order
  })

  const totalCategories = categories.length
  const activeCategories = categories.filter(c => c.is_active).length
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)

if (isLoading && categories.length === 0) {
  return <AdminCategoriesLoading />;
}

  return (
    <>
      <div className="flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium admin-text-primary tracking-tight leading-tight">Categories</h1>
            <p className="text-sm admin-text-secondary mt-1">Organize products into functional catalog hierarchies.</p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null)
              setIsModalOpen(true)
            }}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-full cursor-pointer admin-action-button"
          >
            + Add New Category
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Categories" value={totalCategories} icon={<Layers className="w-5 h-5" />} />
          <StatsCard title="Active Categories" value={activeCategories} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
          <StatsCard title="Products Mapped" value={totalProducts} icon={<Package className="w-5 h-5" />} />
        </div>

        <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted group-focus-within:admin-text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 admin-bg-primary border border-transparent admin-text-primary placeholder:admin-text-muted rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 admin-text-muted hover:admin-text-primary">✕</button>
            )}
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <div className="relative shrink-0 min-w-[220px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted" />
              <select
                value={sortBy}
                title="Sort categories"
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
              >
                {CATEGORY_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="admin-bg-card">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
          {isLoading && categories.length > 0 && (
            <div className="w-full h-1 admin-bg-elevated overflow-hidden">
              <div className="h-full bg-[#A8C7FA] animate-pulse w-1/3 rounded-r-full"></div>
            </div>
          )}
          
          <div className="px-6 py-5 admin-bg-primary/30 border-b admin-border">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold admin-text-muted uppercase tracking-widest">
              <div className="col-span-6 sm:col-span-5">Category Details</div>
              <div className="col-span-3 sm:col-span-2 text-center">Products</div>
              <div className="hidden sm:block sm:col-span-3 text-center">Last Updated</div>
              <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
            </div>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y admin-border min-h-[100px]">
                  {sortedCategories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index} isDragDisabled={sortBy !== 'display_order' || searchQuery.length > 0}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`grid grid-cols-12 gap-4 items-center px-6 py-4 transition-colors group ${
                            snapshot.isDragging ? 'admin-bg-elevated shadow-2xl ring-1 ring-[#0B57D0] z-50 rounded-[24px]' : 'admin-bg-card hover:admin-bg-elevated'
                          }`}
                        >
                          <div className="col-span-6 sm:col-span-5 flex items-center gap-4">
                            <div 
                              {...provided.dragHandleProps} 
                              className={`flex-shrink-0 p-1 rounded-md transition-colors ${sortBy === 'display_order' && !searchQuery ? 'cursor-grab admin-text-muted hover:admin-text-accent hover:admin-bg-primary' : 'opacity-20 cursor-not-allowed'}`}
                              title={sortBy !== 'display_order' ? "Sort by Custom Order to drag" : "Drag to reorder"}
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {category.image ? (
                              <div className="w-10 h-10 rounded-xl overflow-hidden admin-bg-primary border admin-border flex-shrink-0">
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 admin-bg-primary border admin-border rounded-xl flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-4 h-4 text-[#565959]" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium admin-text-primary truncate text-[15px] group-hover:admin-text-accent transition-colors">{category.name}</h3>
                              {category.description && (
                                <p className="text-xs admin-text-muted truncate hidden sm:block mt-0.5">{category.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="col-span-3 sm:col-span-2 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                              (category.product_count ?? 0) > 0 ? 'bg-[#0B57D0]/10 text-[#A8C7FA] border border-[#0B57D0]/30' : 'admin-bg-primary admin-text-muted border admin-border'
                            }`}>
                              {category.product_count || 0} ITEMS
                            </span>
                          </div>

                          <div className="hidden sm:block sm:col-span-3 text-center text-sm admin-text-muted whitespace-nowrap">
                            {formatIST(category.updated_at)}
                          </div>

                          <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory(category)
                                setIsModalOpen(true)
                              }}
                              className="p-2 admin-text-accent hover:bg-[#0B57D0]/20 rounded-full transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => setCategoryToDelete(category)}
                                className={`p-2 transition-colors rounded-full cursor-pointer ${
                                  (category.product_count ?? 0) > 0 
                                    ? 'text-gray-400 dark:text-[#565959] cursor-not-allowed' 
                                    : 'text-red-500 dark:text-[#F2B8B5] hover:bg-red-100 dark:hover:bg-[#8C1D18]/40'
                                }`}
                                disabled={(category.product_count ?? 0) > 0}
                                title={(category.product_count ?? 0) > 0 ? `Cannot delete: Has ${category.product_count} products mapped` : 'Delete Category'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {filteredCategories.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <Layers className="w-12 h-12 admin-text-muted mx-auto mb-4" />
              <p className="admin-text-muted font-medium">No categories found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCategory(null)
        }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <CategoryForm
          initialData={editingCategory ? {
            id: editingCategory.id,
            name: editingCategory.name,
            slug: editingCategory.slug,
            description: editingCategory.description || '',
            image: editingCategory.image,
            is_active: editingCategory.is_active,
            meta_title: editingCategory.meta_title || '',
            meta_description: editingCategory.meta_description || '',
            parent_id: editingCategory.parent_id || null,
            low_stock_threshold: editingCategory.low_stock_threshold || 10,
            updated_at: editingCategory.updated_at
          } : undefined}
          categories={categories}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Modal>

      <AdminConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category Permanently?"
        description={`You are about to completely delete the category "${categoryToDelete?.name}". This action cannot be undone.`}
        confirmText="Delete Category"
        isDestructive={true}
        requireMatch="DELETE"
        isLoading={isSubmitting}
      />
    </>
  )
}