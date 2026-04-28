// src/components/product/QuantitySelector.tsx

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
    if (isNaN(num)) num = min
    if (num < min) num = min
    if (num > max) num = max
    
    if (num !== quantity) {
      onQuantityChange(num)
    }
    setShowModal(false)
  }

  const handleModalClose = () => setShowModal(false)

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
    setInputValue(e.target.value.replace(/[^0-9]/g, ''))
  }

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 🚨 THE FIX: Clean, isolated circular buttons with plain number */}
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || quantity <= min}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 disabled:opacity-40 shadow-sm transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
        
        <div className="min-w-[24px] text-center font-bold text-sm text-gray-900 mx-1">
          {quantity}
        </div>
        
        <button
          type="button"
          onClick={increment}
          disabled={disabled || quantity >= max}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 disabled:opacity-40 shadow-sm transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>

        {/* 🚨 HIGHLIGHTED PENCIL: Tinted blue to stand out */}
        {!disabled && (
          <button
            type="button"
            onClick={openModal}
            className="w-8 h-8 ml-1 flex items-center justify-center rounded-full border border-[#007185]/30 bg-[#F2FAFA] text-[#007185] hover:bg-[#E3F2F2] hover:border-[#007185] transition-all shadow-sm"
            title="Edit quantity"
          >
            <Edit2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Manual Input Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleModalClose}>
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Quantity</h3>
            <p className="text-sm text-gray-600 mb-4">Available: {max} items</p>
            <input
              ref={inputRef}
              type="number"
              title="Quantity"
              placeholder="Enter quantity"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              min={min}
              max={max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007185] focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleModalClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">Cancel</button>
              <button type="button" onClick={handleModalSubmit} className="flex-1 px-4 py-2 text-sm font-medium text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] rounded-full transition-colors border border-[#FCD200]">Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}