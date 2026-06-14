// src/components/product/QuantitySelector.tsx

'use client'

import { Minus, Plus, AlertCircle, RotateCcw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  const [inputValue, setInputValue] = useState<string>((quantity ?? min).toString())
  const inputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setInputValue((quantity ?? min).toString())
  }, [quantity])

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
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
    setInputValue((quantity ?? min).toString())
    setShowModal(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 100)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setInputValue((quantity ?? min).toString())
  }

  const parsedValue = parseInt(inputValue, 10)
  const isBelowMin = !isNaN(parsedValue) && parsedValue < min
  const isAboveMax = !isNaN(parsedValue) && parsedValue > max
  const isEmpty = inputValue.trim() === ''
  const isInvalid = isBelowMin || isAboveMax || isEmpty

  const handleModalSubmit = () => {
    if (isInvalid) return
    if (parsedValue !== quantity) {
      onQuantityChange(parsedValue)
    }
    setShowModal(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleModalSubmit() }
    if (e.key === 'Escape') { e.preventDefault(); handleModalClose() }
  }

  return (
    <>
      <div className="flex items-center gap-2 w-fit">
        <div className="flex items-center bg-stone-200/70 rounded-full p-1">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || quantity <= min}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-stone-300 hover:text-gray-950 active:scale-90 disabled:opacity-20 transition-all cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        
        <div 
          onClick={!disabled ? openModal : undefined}
          className={`min-w-[32px] px-1 flex items-center justify-center text-center font-bold text-[13px] text-gray-900 select-none transition-all ${!disabled ? 'cursor-pointer' : ''}`}
          title={!disabled ? "Edit quantity" : ""}
        >
          {quantity}
        </div>
        
        <button
          type="button"
          onClick={increment}
          disabled={disabled || quantity >= max}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-stone-300 hover:text-gray-950 active:scale-90 disabled:opacity-20 transition-all cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        </div>

        {quantity !== min && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuantityChange(min); }}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer animate-in fade-in zoom-in duration-200"
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Manual portal context view */}
      {showModal && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-fade-in" 
          onClick={handleModalClose}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-5 border border-gray-100 animate-zoom-in text-left flex flex-col gap-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* 🌟 FIXED: Sentence-cased, normal weights, no uppercase shouting */}
              <h3 className="text-[15px] font-medium text-gray-950">Adjust batch count</h3>
              <p className="text-[12px] text-gray-400 font-normal mt-0.5">
                Available stock limit: {max}
              </p>
            </div>
            
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                aria-label="Enter quantity"
                placeholder="1"
                onKeyDown={handleKeyDown}
                className={`w-full h-12 border rounded-xl text-center text-lg font-normal transition-all ${
                  isInvalid && !isEmpty 
                    ? 'border-red-400 bg-red-50/30 text-red-900' 
                    : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:border-gray-950 focus:ring-1 focus:ring-gray-950 outline-none'
                }`}
              />
              
              {isInvalid && !isEmpty && (
                <div className="flex items-center justify-center gap-1.5 mt-2.5 text-red-500 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span className="text-[12px] font-normal">
                    {isBelowMin ? `Minimum is ${min}` : `Maximum is ${max}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 w-full pt-1">
              <button 
                type="button" 
                onClick={handleModalClose} 
                className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleModalSubmit} 
                disabled={isInvalid}
                className="flex-1 h-10 bg-gray-950 hover:bg-black text-white rounded-xl text-[13px] font-medium transition-colors disabled:opacity-30 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}