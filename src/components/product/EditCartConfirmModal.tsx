'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface EditCartConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  oldQty: number
  newQty: number
  oldPrint: string
  newPrint: string
  oldTotal: number
  newTotal: number
  filesWillBeDeleted: boolean
  productName: string
}

export default function EditCartConfirmModal({
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading, 
  oldQty, 
  newQty, 
  oldPrint, 
  newPrint, 
  oldTotal, 
  newTotal, 
  filesWillBeDeleted,
  productName
}: EditCartConfirmModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const isQtyChanged = oldQty !== newQty
  const isPrintChanged = oldPrint !== newPrint
  const isTotalChanged = oldTotal !== newTotal

  return createPortal(
    <div className="z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined} style={{ touchAction: 'none' }} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#007185]" /> Confirm Cart Update
          </h2>
          <button onClick={onClose} disabled={isLoading} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            You are about to replace the existing <span className="font-bold text-gray-900">{productName}</span> in your cart with these new settings:
          </p>

          <div className="space-y-2">
            {/* Quantity Tracker */}
            <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex items-center gap-2 text-sm">
                {isQtyChanged ? (
                  <>
                    <span className="text-gray-500 line-through">{oldQty}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className={`font-bold ${newQty > oldQty ? 'text-green-600' : 'text-[#C7511F]'}`}>{newQty}</span>
                  </>
                ) : (
                  <span className="font-bold text-gray-900">{newQty}</span>
                )}
              </div>
            </div>

            {/* Customization Tracker */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm gap-2">
              <span className="text-sm font-medium text-gray-700 shrink-0">Printing Type</span>
              <div className="flex items-center gap-2 text-sm sm:text-right flex-wrap">
                {isPrintChanged ? (
                  <>
                    <span className="text-gray-500 line-through">{oldPrint}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-bold text-[#007185]">{newPrint}</span>
                  </>
                ) : (
                  <span className="font-bold text-gray-900">{newPrint}</span>
                )}
              </div>
            </div>

            {/* Price Tracker */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-[#F0F8FF] border border-[#007185]/20 rounded-lg mt-2 shadow-sm gap-2">
              <span className="text-sm font-bold text-gray-900 shrink-0">Total Price</span>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                {isTotalChanged && (
                  <>
                    <span className="text-gray-500 line-through">{formatCurrency(oldTotal)}</span>
                    <ArrowRight className="w-4 h-4 text-[#007185]" />
                  </>
                )}
                <span className={`font-bold text-lg ${newTotal > oldTotal ? 'text-green-700' : newTotal < oldTotal ? 'text-[#C7511F]' : 'text-gray-900'}`}>
                  {formatCurrency(newTotal)}
                </span>
              </div>
            </div>

            {/* 🚨 GHOST FILE WARNING 🚨 */}
            {filesWillBeDeleted && (
              <div className="flex items-start gap-2 mt-4 p-3 bg-[#FFF4F4] border border-[#F2B8B5] rounded-lg shadow-sm animate-in zoom-in duration-300">
                <AlertTriangle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" />
                <p className="text-xs text-[#4D2628] leading-relaxed">
                  <strong>Data Deletion Notice:</strong> Switching to a non-custom printing option will permanently delete your previously uploaded artwork files to save storage.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3 bg-gray-50">
          <button onClick={onClose} disabled={isLoading} className="flex-1 py-2.5 px-4 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-2.5 px-4 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-gray-900 rounded-full text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {isLoading ? <><div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"/> Saving...</> : 'Confirm Update'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}