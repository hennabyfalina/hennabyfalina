// src/components/admin/StockUpdateModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { Package, AlertTriangle, TrendingUp, TrendingDown, Box, Sliders } from 'lucide-react'
import { showToast } from '../ui/Toast'

interface Product {
  id: string
  name: string
  sku?: string | null
  stock: number
  retail_price: number    // ✅ Aligned with active database keys
  mrp?: number           // ✅ Aligned with active database keys
  is_variants_enabled: boolean
  variants?: any[]
}

interface StockUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export default function StockUpdateModal({ isOpen, onClose, product, onSuccess }: StockUpdateModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [quantityInput, setQuantityInput] = useState<string>('')
  const [reason, setReason] = useState('restock')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Hydrate initial states cleanly when modal mounts
  useEffect(() => {
    if (isOpen && product) {
      if (product.is_variants_enabled && Array.isArray(product.variants) && product.variants.length > 0) {
        setSelectedVariant(product.variants[0].name)
      } else {
        setSelectedVariant('')
      }
      setAdjustmentType('add')
      setQuantityInput('')
      setReason('restock')
      setNotes('')
      setError('')
      setShowConfirm(false)
    }
  }, [isOpen, product])

  if (!product) return null

  // Resolve context constants depending on selection variant flags
  const activeVariantObj = product.is_variants_enabled && Array.isArray(product.variants)
    ? product.variants.find(v => v.name === selectedVariant)
    : null;

  const currentContextStock = activeVariantObj ? Number(activeVariantObj.stock) || 0 : product.stock;
  const parsedQuantity = quantityInput === '' ? 0 : parseInt(quantityInput, 10);
  
  // Compute final delta offset parameters matching backend schemas (+X or -X)
  const calculatedDelta = adjustmentType === 'add' ? parsedQuantity : -parsedQuantity;
  const finalPredictedStock = currentContextStock + calculatedDelta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid non-zero adjustment quantity.')
      return
    }

    if (finalPredictedStock < 0) {
      setError('Adjustment rejected: Resulting inventory balances cannot fall below zero.')
      return
    }

    setShowConfirm(true)
  }

  const executeSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          variant_name: product.is_variants_enabled ? selectedVariant : null,
          change_amount: calculatedDelta, // ✅ Pure mathematical atomic delta modifier vector
          reason,
          notes: notes.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync stock adjustments')
      }

      showToast('Inventory updated successfully', 'success')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An operational fault occurred while committing updates.')
      setShowConfirm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full px-5 py-4 admin-bg-card border admin-border admin-text-primary placeholder:admin-text-muted rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all text-sm font-medium"
  const labelClass = "block text-[11px] font-bold admin-text-muted mb-2 uppercase tracking-wider ml-1"

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Update Inventory Stock">
        <form onSubmit={handleSubmit} className="space-y-6 admin-text-primary pb-2 text-left select-none">
          
          {/* Target Metadata Card Panel */}
          <div className="admin-bg-primary rounded-[24px] border admin-border p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b admin-border">
              <div className="w-12 h-12 rounded-xl admin-bg-card border admin-border flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 admin-text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-bold admin-text-muted uppercase tracking-widest mb-0.5">Target Product</p>
                <h3 className="text-sm font-medium admin-text-primary capitalize">{product.name.toLowerCase()}</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold admin-text-muted uppercase tracking-widest mb-1">SKU</p>
                <p className="text-sm font-mono admin-text-primary">{product.sku || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold admin-text-muted uppercase tracking-widest mb-1">Base MRP</p>
                <p className="text-sm font-medium admin-text-primary font-mono">{formatCurrency(activeVariantObj?.variant_mrp || product.mrp || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold admin-text-muted uppercase tracking-widest mb-1">Rate</p>
                <p className="text-sm font-bold text-[#93D7A4] font-mono">{formatCurrency(activeVariantObj?.price || product.retail_price)}</p>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t admin-border flex items-center justify-between">
              <span className="text-[11px] font-bold admin-text-muted uppercase tracking-widest flex items-center gap-1.5">
                {product.is_variants_enabled ? <Sliders className="w-3.5 h-3.5 text-purple-400"/> : <Box className="w-3.5 h-3.5"/>}
                Current Segment Stock
              </span>
              <span className="text-base font-bold admin-text-accent font-mono">{currentContextStock} Units</span>
            </div>
          </div>

          {/* Dynamic Variant Selector Node Array */}
          {product.is_variants_enabled && Array.isArray(product.variants) && (
            <div className="animate-in fade-in duration-200">
              <label htmlFor="variantSelect" className={labelClass}>Target Variation Option *</label>
              <select 
                id="variantSelect"
                value={selectedVariant}
                onChange={(e) => {
                  setSelectedVariant(e.target.value)
                  setError('')
                }}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                {product.variants.map((v: any) => (
                  <option key={v.name} value={v.name} className="admin-bg-card">
                    {v.name} (Available: {v.stock} pcs)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Modifiers Controllers Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <label htmlFor="adjustAction" className={labelClass}>Direction *</label>
              <select
                id="adjustAction"
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="add" className="admin-bg-card">➕ Add / Receive</option>
                <option value="subtract" className="admin-bg-card">➖ Deduct / Write-off</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="quantityInput" className={labelClass}>Quantity Modifier Units *</label>
              <input 
                id="quantityInput"
                type="number" 
                min="1"
                step="1"
                placeholder="0"
                value={quantityInput} 
                onChange={(e) => {
                  setQuantityInput(e.target.value)
                  if (error) setError('')
                }} 
                required 
                className={`${inputClass} text-base font-mono ${error ? 'border-[#8C1D18] ring-1 ring-[#8C1D18]' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label htmlFor="reason" className={labelClass}>Ledger Allocation Reason *</label>
              <select 
                id="reason"
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="restock" className="admin-bg-card">Regular Catalog Restock</option>
                <option value="correction" className="admin-bg-card">Audit Count Correction Adjustment</option>
                <option value="damage" className="admin-bg-card">Damaged Stock / Scrap Waste</option>
                <option value="returned" className="admin-bg-card">Customer Return / Re-entry</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Audit Log Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={2} 
              placeholder="e.g. Received via supplier batch invoice, transit drop correction..." 
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-[#4D2628] border border-red-300 dark:border-[#8C1D18] rounded-[20px] p-4 animate-in fade-in">
              <p className="text-sm font-bold text-red-700 dark:text-[#F2B8B5] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </p>
            </div>
          )}

          <div className="pt-4 border-t admin-border flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="w-full py-4 bg-transparent border border-solid admin-border admin-text-primary font-medium rounded-full hover:admin-bg-elevated transition-colors cursor-pointer outline-none"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={parsedQuantity <= 0 || isSubmitting} 
              className={`w-full py-4 rounded-full text-sm font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer outline-none border-none ${
                parsedQuantity <= 0 
                  ? 'admin-bg-card text-[#565959] border admin-border cursor-not-allowed shadow-none' 
                  : 'bg-[#0B57D0] text-white hover:bg-[#0842A0] shadow-blue-900/20'
              }`}
            >
              Review Stock Change
            </button>
          </div>
        </form>
      </Modal>

      <AdminConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Confirm Atomic Stock Adjustment"
        confirmText="Commit Changes"
        isLoading={isSubmitting}
        description={
          <div className="space-y-6 text-left mt-2 select-none">
            <p className="text-sm admin-text-secondary leading-relaxed">
              You are launching an atomic ledger mutation parameters shift for <span className="font-bold admin-text-primary capitalize">{product.name.toLowerCase()}</span>.
            </p>
            
            <div className="admin-bg-primary p-5 rounded-[24px] border admin-border space-y-4">
              {product.is_variants_enabled && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] admin-text-muted uppercase tracking-widest font-bold">Variation</span>
                  <span className="text-sm font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/30 font-mono">{selectedVariant}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[11px] admin-text-muted uppercase tracking-widest font-bold">Current Base</span>
                <span className="text-sm font-medium admin-text-secondary font-mono">{currentContextStock} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] admin-text-muted uppercase tracking-widest font-bold">Projected Inventory</span>
                <span className="text-sm font-bold admin-text-primary admin-bg-elevated px-3 py-1 rounded-md font-mono">{finalPredictedStock} units</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t admin-border">
                <span className="text-[11px] admin-text-muted uppercase tracking-widest font-bold">Calculated Delta Shift</span>
                <span className={`text-sm font-bold flex items-center gap-1 font-mono ${
                  calculatedDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {calculatedDelta > 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4" />}
                  {calculatedDelta > 0 ? '+' : ''}{calculatedDelta} Units
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-start justify-between gap-4">
                <span className="text-[11px] admin-text-muted uppercase tracking-widest font-bold shrink-0">Log Type</span>
                <span className="text-sm admin-text-secondary capitalize">{reason.replace(/_/g, ' ')}</span>
              </div>
              {notes && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[11px] admin-text-muted uppercase tracking-widest font-bold shrink-0">Audit Details</span>
                  <span className="text-sm admin-text-accent text-right break-words italic bg-[#0B57D0]/10 px-3 py-1.5 rounded-lg border border-[#0B57D0]/30 font-medium">{notes}</span>
                </div>
              )}
            </div>
          </div>
        }
      />
    </>
  )
}