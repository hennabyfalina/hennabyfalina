'use client'

import { Minus, Plus, Edit2 } from 'lucide-react'
import { useState, useRef } from 'react'

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
  disabled = false,
}: QuantitySelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState<string>(quantity.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  const increment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity < max && !disabled) {
      const newQty = quantity + 1
      onQuantityChange(newQty)
    }
  }

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity > min && !disabled) {
      const newQty = quantity - 1
      onQuantityChange(newQty)
    }
  }

  const openModal = () => {
    if (disabled) return
    setInputValue(quantity.toString())
    setShowModal(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 100)
  }

  const handleModalSubmit = () => {
    let num = parseInt(inputValue, 10)
    
    // Validate input
    if (isNaN(num)) {
      num = min
    }
    // Clamp to min/max
    if (num < min) num = min
    if (num > max) num = max
    
    if (num !== quantity) {
      onQuantityChange(num)
    }
    setShowModal(false)
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleModalSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleModalClose()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(value)
  }

  return (
    <>
      <div className="inline-flex items-center h-8 bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || quantity <= min}
          className="w-8 h-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className="w-12 h-full flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-medium text-sm transition-colors cursor-pointer group relative"
          aria-label="Edit quantity"
          title="Click to edit quantity"
        >
          <span>{quantity}</span>
          <Edit2 className="w-2.5 h-2.5 absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <button
          type="button"
          onClick={increment}
          disabled={disabled || quantity >= max}
          className="w-8 h-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quantity Input Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleModalClose}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Quantity</h3>
            <p className="text-sm text-gray-600 mb-4">
              Available: {max} items
            </p>
            
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              min={min}
              max={max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007185] focus:border-transparent"
              placeholder="Enter quantity"
              autoFocus
            />
            
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={handleModalClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSubmit}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 rounded-md transition-colors border border-[#FCD200]"
              >
                Apply
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}