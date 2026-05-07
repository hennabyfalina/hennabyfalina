// src/components/admin/StockUpdateModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { Package, AlertTriangle, TrendingUp, TrendingDown, Box } from 'lucide-react'

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
    return { isValid: false, error: 'Please enter a valid number.' }
  }
  if (newStock < 0) {
    return { isValid: false, error: 'Stock cannot be negative.' }
  }
  if (newStock === currentStock) {
    return { isValid: false, error: 'New stock is identical to current stock.' }
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
          product_id: product.id, // 🚨 Updated to match standard Supabase schema
          stock: parsedStockNum,  // 🚨 Updated to match standard Supabase schema
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

  const inputClass = "w-full px-5 py-4 bg-[#1E1F20] border border-[#333538] text-[#E3E3E3] placeholder:text-[#565959] rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all"
  const labelClass = "block text-[11px] font-bold text-[#8E9196] mb-2 uppercase tracking-wider ml-1"

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Update Inventory Stock">
        <form onSubmit={handleSubmit} className="space-y-6 text-[#E3E3E3] pb-2">
          
          {/* 🚨 GEMINI READ-ONLY PRODUCT CARD 🚨 */}
          <div className="bg-[#131314] rounded-[24px] border border-[#333538] p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#333538]">
              <div className="w-12 h-12 rounded-xl bg-[#1E1F20] border border-[#333538] flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-[#A8C7FA]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-0.5">Target Product</p>
                <h3 className="text-sm font-medium text-[#E3E3E3]">{product.name}</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">Retail MRP</p>
                <p className="text-sm font-medium text-[#E3E3E3]">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">Selling</p>
                <p className="text-sm font-medium text-[#E3E3E3]">{formatCurrency(product.selling_price || product.price)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8E9196] uppercase tracking-widest mb-1">Wholesale</p>
                <p className="text-sm font-bold text-[#93D7A4]">{product.bulk_price ? formatCurrency(product.bulk_price) : 'N/A'}</p>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-[#333538] flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8E9196] uppercase tracking-widest">Current System Stock</span>
              <span className="text-base font-bold text-[#A8C7FA] flex items-center gap-1.5"><Box className="w-4 h-4"/> {product.stock} Units</span>
            </div>
          </div>

          {/* 🚨 EDITABLE FIELDS 🚨 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="newStock" className={labelClass}>New Available Quantity *</label>
              <input 
                id="newStock"
                type="number" 
                min="0" 
                step="1"
                value={newStock} 
                onChange={(e) => {
                  setNewStock(e.target.value)
                  if (error) setError('')
                }} 
                required 
                autoFocus
                className={`${inputClass} text-xl font-medium ${error ? 'border-[#8C1D18] ring-1 ring-[#8C1D18]' : ''}`}
              />
            </div>
            <div>
              <label htmlFor="reason" className={labelClass}>Adjustment Reason *</label>
              <select 
                id="reason"
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="Manual" className="bg-[#1E1F20]">Manual Adjustment</option>
                <option value="Purchase Order" className="bg-[#1E1F20]">Purchase Order (Stock Received)</option>
                <option value="Customer Return" className="bg-[#1E1F20]">Customer Return</option>
                <option value="Damaged" className="bg-[#1E1F20]">Damaged / Wastage</option>
                <option value="Audit" className="bg-[#1E1F20]">Inventory Audit</option>
                <option value="Restock" className="bg-[#1E1F20]">Regular Restock</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Log Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={2} 
              placeholder="e.g., Invoice #INV-8492, damaged in transit..." 
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* 🚨 GEMINI ERROR BANNER 🚨 */}
          {error && (
            <div className="bg-[#4D2628] border border-[#8C1D18] rounded-[20px] p-4 animate-in fade-in">
              <p className="text-sm font-bold text-[#F2B8B5] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-[#333538] flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="w-full py-4 bg-transparent border border-[#333538] text-[#E3E3E3] font-medium rounded-full hover:bg-[#282A2C] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isUnchanged || isSubmitting} 
              className={`w-full py-4 rounded-full text-sm font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer ${
                isUnchanged 
                  ? 'bg-[#1E1F20] text-[#565959] border border-[#333538] cursor-not-allowed shadow-none' 
                  : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] shadow-blue-900/20'
              }`}
            >
              Review Stock Change
            </button>
          </div>
        </form>
      </Modal>

      {/* 🚨 INTEGRATED ADMIN CONFIRM MODAL 🚨 */}
      <AdminConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Confirm Stock Adjustment"
        confirmText="Commit Changes"
        isLoading={isSubmitting}
        description={
          <div className="space-y-6 text-left mt-2">
            <p className="text-sm text-[#C4C7C5] leading-relaxed">
              You are about to adjust the inventory ledger for <span className="font-bold text-[#E3E3E3]">{product.name}</span>. Please verify the delta below.
            </p>
            
            <div className="bg-[#131314] p-5 rounded-[24px] border border-[#333538] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold">Current Stock</span>
                <span className="text-sm font-medium text-[#C4C7C5]">{product.stock} units</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold">New Target</span>
                <span className="text-sm font-bold text-[#E3E3E3] bg-[#282A2C] px-3 py-1 rounded-md">{newStock} units</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-[#333538]">
                <span className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold">Net Change (Delta)</span>
                <span className={`text-sm font-bold flex items-center gap-1 ${
                  stockDifference > 0 ? 'text-[#93D7A4]' : stockDifference < 0 ? 'text-[#F9AB00]' : 'text-[#8E9196]'
                }`}>
                  {stockDifference > 0 ? <TrendingUp className="w-4 h-4"/> : stockDifference < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                  {stockDifference > 0 ? '+' : ''}{stockDifference}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {reason !== 'Manual' && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold shrink-0">Log Reason</span>
                  <span className="text-sm text-[#C4C7C5] text-right">{reason}</span>
                </div>
              )}
              {notes && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold shrink-0">Audit Note</span>
                  <span className="text-sm text-[#A8C7FA] text-right break-words italic bg-[#0B57D0]/10 px-3 py-1.5 rounded-lg border border-[#0B57D0]/30">{notes}</span>
                </div>
              )}
            </div>
          </div>
        }
      />
    </>
  )
}