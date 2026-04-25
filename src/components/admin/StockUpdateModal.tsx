'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'

interface Product {
  id: string
  name: string
  stock: number
  price: number
  selling_price?: number
  bulk_price?: number | null
}

interface StockUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

// 🔒 Validation helper
const validateStockUpdate = (newStock: number, currentStock: number): { isValid: boolean; error: string | null } => {
  if (isNaN(newStock)) {
    return { isValid: false, error: 'Please enter a valid number' }
  }
  if (newStock < 0) {
    return { isValid: false, error: 'Stock cannot be negative' }
  }
  if (newStock === currentStock) {
    return { isValid: false, error: 'New stock is same as current stock' }
  }
  return { isValid: true, error: null }
}

export default function StockUpdateModal({ isOpen, onClose, product, onSuccess }: StockUpdateModalProps) {
  const [newStock, setNewStock] = useState<string>('')
  const [reason, setReason] = useState('Manual')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      setNewStock(product.stock.toString())
      setReason('Manual')
      setNotes('')
      setError('')
      setShowConfirm(false)
    }
  }, [isOpen, product])

  if (!product) return null

  const parsedStock = parseInt(newStock)
  const isUnchanged = newStock === product.stock.toString()
  const stockDifference = !isNaN(parsedStock) ? parsedStock - product.stock : 0

  // 🔒 Validate before showing confirm
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const parsedStockNum = parseInt(newStock)
    const validation = validateStockUpdate(parsedStockNum, product.stock)
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid stock value')
      return
    }

    setShowConfirm(true)
  }

  const executeSubmit = async () => {
    setIsSubmitting(true)
    const parsedStockNum = parseInt(newStock)
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          newStock: parsedStockNum,
          reason,
          notes: notes.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update stock')
      }
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating stock.')
      setShowConfirm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Confirm Stock Update">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to update the stock for <span className="font-semibold text-gray-900">{product.name}</span>?
          </p>
          <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Current Stock</span>
              <span className="font-semibold text-gray-900">{product.stock} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">New Stock</span>
              <span className="font-semibold text-blue-600">{newStock} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Adjustment</span>
              <span className={`font-semibold ${stockDifference > 0 ? 'text-green-600' : stockDifference < 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                {stockDifference > 0 ? '+' : ''}{stockDifference}
              </span>
            </div>
            {reason !== 'Manual' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Reason</span>
                <span className="text-gray-700">{reason}</span>
              </div>
            )}
            {notes && (
              <div className="flex justify-between items-start">
                <span className="text-gray-500 font-medium">Notes</span>
                <span className="text-gray-700 max-w-[200px] text-right break-words">{notes}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowConfirm(false)} disabled={isSubmitting} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50">
              Back
            </button>
            <button type="button" onClick={executeSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50">
              {isSubmitting ? 'Updating...' : 'Confirm Update'}
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Inventory Stock">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Read-Only Product Info */}
        <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-4 border border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
            <div className="text-sm font-semibold text-gray-900">{product.name}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">MRP Price</label>
              <div className="text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Selling Price</label>
              <div className="text-sm font-medium text-gray-900">₹{(product.selling_price || product.price).toFixed(2)}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bulk Price</label>
              <div className="text-sm font-medium text-green-700">{product.bulk_price ? `₹${product.bulk_price.toFixed(2)}` : 'N/A'}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/50 mt-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Current Stock</label>
            <div className="text-sm font-medium text-blue-600">{product.stock} units</div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="newStock" className="block text-sm font-medium text-gray-700">New Stock *</label>
            <input 
              id="newStock"
              type="number" 
              min="0" 
              step="1"
              value={newStock} 
              onChange={(e) => {
                const val = e.target.value
                setNewStock(val)
                // Clear error when user types
                if (error) setError('')
              }} 
              required 
              placeholder="Enter quantity"
              title="New stock quantity"
              className={`w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500">Enter the new total stock quantity</p>
          </div>
          <div className="space-y-1">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason *</label>
            <select 
              id="reason"
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              title="Reason for stock update"
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="Manual">Manual Adjustment</option>
              <option value="Purchase Order">Purchase Order (Stock Received)</option>
              <option value="Customer Return">Customer Return</option>
              <option value="Damaged">Damaged / Wastage</option>
              <option value="Audit">Inventory Audit</option>
              <option value="Restock">Regular Restock</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            rows={2} 
            placeholder="Add any references or details here (e.g., invoice number, reason details)..." 
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2">
            <span className="text-red-500 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={isUnchanged || isSubmitting} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isUnchanged 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Review Update
          </button>
        </div>
      </form>
    </Modal>
  )
}