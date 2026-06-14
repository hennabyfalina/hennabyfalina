// src/components/cart/CartQuantitySelector.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

interface CartQuantitySelectorProps {
  quantity: number
  onQuantityChange: (newQty: number) => void
  min?: number
  max?: number
}

export default function CartQuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99999
}: CartQuantitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [customValue, setCustomValue] = useState(quantity.toString())
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click interaction paths
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectOption = (val: number | 'more') => {
    setIsOpen(false)
    if (val === 'more') {
      setCustomValue(quantity.toString())
      setShowModal(true)
    } else {
      onQuantityChange(val)
    }
  }

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseInt(customValue, 10)
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onQuantityChange(parsed)
      setShowModal(false)
    } else {
      // Revert if out of bounds safely
      setCustomValue(quantity.toString())
      setShowModal(false)
    }
  }

  return (
    <div className="relative inline-block text-left font-sans antialiased" ref={containerRef}>
      
      {/* 🚀 Dropdown Toggle Button Capsule */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3.5 border border-gray-200 hover:border-gray-300 bg-white rounded-lg text-[14px] font-medium text-gray-900 flex items-center gap-2 transition-colors cursor-pointer outline-none shadow-none"
      >
        <span>Qty: {quantity}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {/* 🚀 Options Dropdown Overlay Menu List */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1 min-w-[80px] bg-white border border-gray-200 rounded-lg py-1.5 shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-150">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleSelectOption(num)}
              className={`w-full text-center px-4 py-2 text-[14px] transition-colors cursor-pointer outline-none ${
                quantity === num 
                  ? 'bg-stone-50 text-blue-600 font-semibold' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleSelectOption('more')}
            className="w-full text-center px-4 py-2 text-[14px] text-gray-500 hover:bg-gray-50 font-medium border-t border-gray-50 mt-0.5 cursor-pointer outline-none"
          >
            more
          </button>
        </div>
      )}

      {/* 🚀 Bulk Numeric Enter Input Modal Overlay Portal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/10 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowModal(false)} />
          
          <form 
            onSubmit={handleModalSubmit}
            className="relative bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden animate-zoom-in flex flex-col text-left"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[18px] font-normal text-gray-950">Enter Quantity</h3>
            </div>

            {/* Input Body Content Field */}
            <div className="px-5 py-2">
              <input
                type="number"
                id="cart-custom-quantity"
                aria-label="Enter custom quantity"
                pattern="[0-9]*"
                inputMode="numeric"
                min={min}
                max={max}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="w-full h-11 px-0 bg-transparent border-b border-gray-200 focus:border-gray-950 text-[20px] font-normal text-gray-900 outline-none transition-colors"
                placeholder="Enter quantity"
                title="Enter custom quantity"
                autoFocus
              />
              <p className="text-[13px] text-gray-400 mt-1">
                Stock limit: {min} – {max} items
              </p>
            </div>

            {/* Action Dialog Confirm Base Buttons */}
            <div className="flex border-t border-gray-100 mt-6 h-12 w-full text-[15px] font-medium tracking-wide shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 h-full border-r border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors capitalise cursor-pointer outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-full text-blue-600 hover:bg-gray-50 transition-colors capitalise font-semibold cursor-pointer outline-none"
              >
                Apply
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

    </div>
  )
}