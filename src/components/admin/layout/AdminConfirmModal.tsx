// src/components/admin/layout/AdminConfirmModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'   // ✅ Add this
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
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setVerifyText('')
      }, 300)
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

  const isMatchValid = requireMatch ? verifyText === requireMatch : true

  const colors = {
    bg: 'bg-[#1E1F20]',
    surface: 'bg-[#131314]',
    border: 'border-[#333538]',
    text: 'text-[#E3E3E3]',
    muted: 'text-[#8E9196]',
    accent: 'text-[#A8C7FA]',
    danger: 'text-[#F2B8B5]',
    dangerBg: 'bg-[#4D2628]',
    dangerBorder: 'border-[#8C1D18]',
  }

  // 🚀 Render using createPortal
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={!isLoading ? onClose : undefined} 
      />
      
      <div className={`relative ${colors.bg} border ${colors.border} rounded-[24px] shadow-2xl p-6 md:p-8 w-full max-w-[400px] animate-in zoom-in-95 duration-200 overflow-hidden`}>
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-center">
              {icon && (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 border transition-all
                  ${isDestructive 
                    ? 'bg-[#4D2628]/30 border-[#8C1D18]/50 text-[#F2B8B5]' 
                    : 'bg-[#0B57D0]/10 border-[#0B57D0]/30 text-[#A8C7FA]'
                  }`}
                >
                  {icon}
                </div>
              )}
              <h2 className={`text-xl font-medium mb-2 tracking-tight ${colors.text}`}>{title}</h2>
              <div className={`text-sm ${colors.muted} mb-8 leading-relaxed`}>{description}</div>
              <div className="flex flex-col w-full gap-2.5">
                <button 
                  onClick={handleProceedToStep2} 
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 rounded-full text-sm font-medium transition-all cursor-pointer disabled:opacity-50
                    ${isDestructive 
                      ? 'bg-[#B3261E] text-white hover:bg-[#8C1D18]' 
                      : 'bg-[#E3E3E3] text-[#131314] hover:bg-white'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (requireMatch ? 'Proceed to Action' : confirmText)}
                </button>
                <button 
                  onClick={onClose} 
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 bg-transparent border ${colors.border} ${colors.text} hover:bg-[#282A2C] rounded-full text-sm font-medium transition-all cursor-pointer`}
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
              <div className="w-14 h-14 bg-[#4D2628]/30 border border-[#8C1D18]/50 text-[#F2B8B5] rounded-full flex items-center justify-center mb-5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-medium mb-2 text-[#E3E3E3] tracking-tight">Final Authorization</h2>
              <p className={`text-sm ${colors.muted} mb-6 leading-relaxed`}>
                This is a permanent action. Please type <span className="font-mono text-[#E3E3E3] bg-[#131314] border border-[#333538] px-1.5 py-0.5 rounded text-xs select-all">{requireMatch}</span> to confirm.
              </p>
              <div className="w-full relative group mb-8">
                <input
                  type="text"
                  value={verifyText}
                  onChange={(e) => setVerifyText(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="Type the key exactly..."
                  className={`w-full ${colors.surface} border ${colors.border} text-[#E3E3E3] px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all font-mono text-center text-sm placeholder:text-[#565959] placeholder:font-sans`}
                  autoComplete="off"
                  spellCheck="false"
                />
                {isMatchValid && verifyText.length > 0 && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93D7A4] animate-in zoom-in" />
                )}
              </div>
              <div className="flex flex-col w-full gap-2.5">
                <button 
                  onClick={onConfirm} 
                  disabled={!isMatchValid || isLoading}
                  className={`w-full py-3.5 px-6 rounded-full text-sm font-medium transition-all active:scale-[0.98]
                    ${!isMatchValid 
                      ? 'bg-[#282A2C] text-[#565959] cursor-not-allowed border border-[#333538]' 
                      : 'bg-[#B3261E] hover:bg-[#8C1D18] text-white cursor-pointer'
                    }`}
                >
                  {isLoading ? 'Processing...' : `Verify & ${confirmText}`}
                </button>
                <button 
                  onClick={onClose} 
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 bg-transparent border ${colors.border} ${colors.text} hover:bg-[#282A2C] rounded-full text-sm font-medium transition-all cursor-pointer`}
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