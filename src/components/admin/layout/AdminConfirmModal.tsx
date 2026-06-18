// src/components/admin/layout/AdminConfirmModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface AdminConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  icon?: React.ReactNode
  isDestructive?: boolean
  requireMatch?: string
  isLoading?: boolean
}

export default function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  isDestructive = false,
  requireMatch,
  isLoading = false
}: AdminConfirmModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [verifyText, setVerifyText] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep(1)
        setVerifyText('')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleProceedToStep2 = () => {
    if (requireMatch) {
      setStep(2)
    } else {
      onConfirm()
    }
  }

  const isMatchValid = requireMatch ? verifyText.trim() === requireMatch.trim() : true

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 font-sans text-center antialiased select-none" style={{ height: '100dvh' }}>
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={!isLoading ? onClose : undefined} 
        style={{ touchAction: 'none' }}
      />
      
      <div className="relative z-10 admin-bg-card border border-solid admin-border rounded-[24px] shadow-2xl p-6 md:p-8 w-full max-w-[400px] animate-in zoom-in-95 duration-200 overflow-hidden text-left flex flex-col">
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-center">
              {icon && (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 border border-solid transition-all
                  ${isDestructive 
                    ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' 
                    : 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {icon}
                </div>
              )}
              <h2 className="text-xl font-medium mb-2 tracking-tight admin-text-primary">{title}</h2>
              <div className="text-sm admin-text-muted mb-8 leading-relaxed font-medium">{description}</div>
              <div className="flex flex-col w-full gap-2.5">
                <button 
                  type="button"
                  onClick={handleProceedToStep2} 
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 rounded-full text-sm font-bold transition-all cursor-pointer disabled:opacity-50 border-none outline-none active:scale-[0.98]
                    ${isDestructive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-solid border-current border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (requireMatch ? 'Proceed to Action' : confirmText)}
                </button>
                <button 
                  type="button"
                  onClick={onClose} 
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 bg-transparent border border-solid admin-border admin-text-primary hover:admin-bg-elevated rounded-full text-sm font-bold transition-all cursor-pointer outline-none"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && requireMatch && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 border border-solid border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-medium mb-2 admin-text-primary tracking-tight">Final Authorization</h2>
              <p className="text-sm admin-text-muted mb-6 leading-relaxed font-medium">
                This is a permanent operation. Please type <span className="font-mono admin-text-primary admin-bg-primary border border-solid admin-border px-1.5 py-0.5 rounded text-xs select-all font-bold">{requireMatch}</span> to confirm.
              </p>
              <div className="w-full relative group mb-8">
                <input
                  type="text"
                  value={verifyText}
                  onChange={(e) => setVerifyText(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="Type the key exactly..."
                  className="w-full admin-bg-primary border border-solid admin-border admin-text-primary px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-center text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 font-semibold"
                  autoComplete="off"
                  spellCheck="false"
                />
                {isMatchValid && verifyText.length > 0 && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 dark:text-green-400 animate-in zoom-in" />
                )}
              </div>
              <div className="flex flex-col w-full gap-2.5">
                <button 
                  type="button"
                  onClick={onConfirm} 
                  disabled={!isMatchValid || isLoading}
                  className={`w-full py-3.5 px-6 rounded-full text-sm font-bold transition-all active:scale-[0.98] border-none outline-none
                    ${!isMatchValid 
                      ? 'admin-bg-elevated text-gray-500 cursor-not-allowed border border-solid admin-border' 
                      : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                    }`}
                >
                  {isLoading ? 'Processing...' : `Verify & ${confirmText}`}
                </button>
                <button 
                  type="button"
                  onClick={onClose} 
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 bg-transparent border border-solid admin-border admin-text-primary hover:admin-bg-elevated rounded-full text-sm font-bold transition-all cursor-pointer outline-none"
                >
                  Abort
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}