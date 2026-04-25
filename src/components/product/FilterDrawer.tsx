'use client'

import Modal from '@/components/ui/Modal'
import FilterSidebar from './FilterSidebar'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  categories: any[]
  currentCategory: string
  currentSort: string
  minPrice: string
  maxPrice: string
  updateFilters: (updates: Record<string, string | null>) => void
  clearFilters: () => void
}

export default function FilterDrawer({ isOpen, onClose, ...filterProps }: FilterDrawerProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filters">
      <div className="p-4">
        {/* Reuse the sidebar but hide the mobile-redundant borders */}
        <div className="border-none shadow-none">
          <FilterSidebar 
            {...filterProps} 
            updateFilters={(updates) => {
              filterProps.updateFilters(updates);
              // Optional: Uncomment the next line if you want the drawer to close immediately on selection
              // onClose(); 
            }}
          />
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-[#f0c14b] hover:bg-[#edd38b] border border-[#a88734] text-gray-900 rounded-sm font-bold text-sm transition-colors shadow-sm"
          >
            Show Results
          </button>
        </div>
      </div>
    </Modal>
  )
}