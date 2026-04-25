'use client'

import { useState, useEffect } from 'react'
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
import { Layers, CheckCircle, Package, GripVertical } from 'lucide-react'

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isError = type === 'error'

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up flex items-center gap-3 text-sm font-medium">
      {isError ? <span className="text-red-400">⚠️</span> : <span className="text-green-400">✓</span>}
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

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('display_order')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    const data = await getCategoriesWithCounts()
    setCategories(data)
    setIsLoading(false)
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

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
      showToast('Category deleted successfully', 'success')
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

    // Update order in database
    const orderedIds = items.map(item => item.id)
    await updateCategoryOrder(orderedIds)
  }

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Sort filtered categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'updated_desc') return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
    return a.display_order - b.display_order
  })

  // Calculate stats
  const totalCategories = categories.length
  const activeCategories = categories.filter(c => c.is_active).length
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading categories...</span>
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
            <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Organize products into functional categories</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <select
              value={sortBy}
              title="Sort categories"
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="display_order">Custom Order</option>
              <option value="updated_desc">Recently Updated</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <button
              onClick={() => {
                setEditingCategory(null)
                setIsModalOpen(true)
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Add Category
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Categories"
            value={totalCategories}
            icon={<Layers className="w-5 h-5" />}
          />
          <StatsCard
            title="Active Categories"
            value={activeCategories}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Products Mapped"
            value={totalProducts}
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all text-sm"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-5 sm:col-span-4">Category</div>
              <div className="col-span-3 sm:col-span-2 text-center">Products</div>
              <div className="hidden sm:block sm:col-span-3 text-center">Last Updated</div>
              <div className="col-span-4 sm:col-span-3 text-right">Actions</div>
            </div>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sortedCategories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-gray-100 last:border-0 transition-colors bg-white ${
                            snapshot.isDragging ? 'shadow-md ring-1 ring-gray-200 rounded-lg z-10' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                            {sortBy === 'display_order' ? (
                              <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                                <GripVertical className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 flex-shrink-0" />
                            )}
                            {category.image ? (
                              <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
                              {category.description && (
                                <p className="text-xs text-gray-500 truncate hidden sm:block">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="col-span-3 sm:col-span-2 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              (category.product_count ?? 0) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {category.product_count || 0} {category.product_count === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                          <div className="hidden sm:block sm:col-span-3 text-center text-xs text-gray-500 whitespace-nowrap">
                            {formatIST(category.updated_at)}
                          </div>
                          <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingCategory(category)
                                setIsModalOpen(true)
                              }}
                              className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setCategoryToDelete(category)}
                              className="text-sm text-red-600 hover:text-red-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={(category.product_count ?? 0) > 0}
                              title={(category.product_count ?? 0) > 0 ? `Has ${category.product_count} products` : ''}
                            >
                              Delete
                            </button>
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

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              {searchQuery ? (
                <div>
                  <p className="text-gray-500">No categories matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">No categories yet. Click "Add Category" to get started.</p>
                </div>
              )}
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
        title={editingCategory ? 'Edit Category' : 'Add Category'}
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

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCategoryToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Category</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{categoryToDelete.name}</span>? 
              This action cannot be undone.
            </p>
            {(categoryToDelete.product_count ?? 0) > 0 && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ This category has {categoryToDelete.product_count} {categoryToDelete.product_count === 1 ? 'product' : 'products'}. 
                  Delete them first or reassign to another category.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={(categoryToDelete.product_count ?? 0) > 0}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

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
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  )
}