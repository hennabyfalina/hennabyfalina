'use client'

import { Minus, Plus, Edit2, AlertCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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

  // Enterprise Scroll Lock
  // This completely stops the background page from scrolling while the modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    // Cleanup function to ensure it always unlocks if the component unmounts
    return () => {
      document.body.style.overflow = ''
    }
  }, [showModal])

  const increment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity < max && !disabled) {
      onQuantityChange(quantity + 1)
    }
  }

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity > min && !disabled) {
      onQuantityChange(quantity - 1)
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

  const handleModalClose = () => {
    setShowModal(false)
    setInputValue(quantity.toString()) // Reset to current valid quantity if they cancel
  }

  // Real-time Validation Engine
  const parsedValue = parseInt(inputValue, 10)
  const isBelowMin = !isNaN(parsedValue) && parsedValue < min
  const isAboveMax = !isNaN(parsedValue) && parsedValue > max
  const isEmpty = inputValue.trim() === ''
  const isInvalid = isBelowMin || isAboveMax || isEmpty

  const handleModalSubmit = () => {
    if (isInvalid) return // Block submission if invalid
    
    if (parsedValue !== quantity) {
      onQuantityChange(parsedValue)
    }
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
    setInputValue(e.target.value.replace(/[^0-9]/g, ''))
  }

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || quantity <= min}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 disabled:opacity-40 shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
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
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 disabled:opacity-40 shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>

        {!disabled && (
          <button
            type="button"
            onClick={openModal}
            className="w-8 h-8 ml-1 flex items-center justify-center rounded-full border border-[#ffffff]/30 bg-[#ffffff] text-[#000000] hover:bg-[#E3F2F2] hover:border-[#ffffff] transition-all shadow-sm cursor-pointer"
            title="Edit quantity"
          >
            <Edit2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Manual Input Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" 
          onClick={handleModalClose}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Quantity</h3>
            <p className="text-sm text-gray-600 mb-4">Available: {max} items</p>
            
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                title="Quantity"
                placeholder={`Min ${min}`}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border rounded-md text-center text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 transition-colors ${
                  isInvalid && !isEmpty 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-[#007185] focus:border-transparent'
                }`}
              />
              
              {/* Error Message */}
              {isInvalid && !isEmpty && (
                <div className="flex items-center justify-center gap-1 mt-2 text-red-600 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {isBelowMin ? `Minimum quantity is ${min}` : `Maximum is ${max}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={handleModalClose} 
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleModalSubmit} 
                disabled={isInvalid}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] rounded-full transition-colors border border-[#FCD200] cursor-pointer disabled:opacity-50 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
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