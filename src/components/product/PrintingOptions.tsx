// src/components/product/PrintingOptions.tsx

'use client'

import { useState } from 'react'
import { CheckCircle2, Truck, UploadCloud, AlertCircle, Eye, Trash2 } from 'lucide-react'
import { PRINTING_TIERS } from '@/config/b2b-rules'
import { uploadB2BArtwork, getSignedB2BUrl, deleteB2BArtwork } from '@/lib/supabase/b2b-storage'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'
import PreviewModal from '@/components/ui/PreviewModal'
import { useEffect } from 'react'

interface ArtworkFile {
  path: string
  url: string
  name: string
  size: number
}

interface PrintingOptionsProps {
  b2bState: {
    type: string
    minQty: number
    days: number
    instructions: string
    artworkUrls: string[]
    artworks: ArtworkFile[]
    isAgreementChecked: boolean
  }
  onChange: (data: any) => void
}

const MAX_FILES = 3
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB per file
const MAX_TOTAL_SIZE = 30 * 1024 * 1024 // 30MB total

export default function PrintingOptions({ b2bState, onChange }: PrintingOptionsProps) {
  const { user, isLoading } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  
  const [previewFile, setPreviewFile] = useState<{ url: string, name: string } | null>(null)

  const { type: selectedType, instructions = '', artworks = [], isAgreementChecked = true } = b2bState

  const activeTierConfig = PRINTING_TIERS.find(o => o.id === selectedType)
  const isCustomPrint = selectedType.includes('Color')

  // Automatically check if they returned from login with a pending upload
  useEffect(() => {
    if (user && !isLoading && typeof window !== 'undefined' && sessionStorage.getItem('pending_upload') === 'true') {
      sessionStorage.removeItem('pending_upload')
      showToast('Session restored. You can now upload your artwork.', 'success')
    }
  }, [user, isLoading])

  const handleAgreementToggle = (checked: boolean) => {
    onChange({ 
      ...b2bState,
      isAgreementChecked: checked 
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (!user) {
      if (isLoading) {
        showToast('Please wait while we verify your session...', 'info')
        return
      }
      showToast('Please login to upload artwork', 'warning')
      
      // Store a flag so the user knows they need to upload after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_upload', 'true')
        const currentUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
        window.location.href = `/login?next=${currentUrl}`
      }
      return
    }

    if (artworks.length + files.length > MAX_FILES) {
      showToast(`You can only upload up to ${MAX_FILES} files total.`, 'warning')
      return
    }

    let currentTotalSize = artworks.reduce((sum, file) => sum + file.size, 0)
    const validFiles: File[] = []

    // 🚨 Strict Size Validation
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`"${file.name}" exceeds the 15MB limit.`, 'error')
        continue
      }
      if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        showToast('Total upload size cannot exceed 30MB.', 'error')
        break
      }
      currentTotalSize += file.size
      validFiles.push(file)
    }

    if (!validFiles.length) return

    setIsUploading(true)
    try {
      const newArtworks = [...artworks]
      
      // Upload all valid files concurrently
      await Promise.all(validFiles.map(async (file) => {
        const internalPath = await uploadB2BArtwork(file, user.id)
        const signed = await getSignedB2BUrl(internalPath)
        newArtworks.push({ path: internalPath, url: signed || '', name: file.name, size: file.size })
      }))

      onChange({ 
        ...b2bState,
        artworkUrls: newArtworks.map(a => a.path),
        artworks: newArtworks
      })
      
      showToast(`${validFiles.length} file(s) uploaded and verified`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error')
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = '' // Reset input
    }
  }

  // 🚨 The "Ghost Upload" Fix: Optimistic UI Deletion + Active Backend Deletion
  const handleRemoveArtwork = async (indexToRemove: number) => {
    const artworkToRemove = artworks[indexToRemove]
    
    // 1. Remove from UI instantly
    const newArtworks = artworks.filter((_, idx) => idx !== indexToRemove)

    onChange({ 
      ...b2bState,
      artworkUrls: newArtworks.map(a => a.path),
      artworks: newArtworks
    })
    
    showToast('Artwork removed', 'info')

    // 2. Delete from Supabase in the background
    try {
      await deleteB2BArtwork(artworkToRemove.path)
    } catch (err) {
      console.warn('Failed active deletion. Cron job will sweep this file later.', err)
    }
  }

  const handleOptionClick = (opt: any) => {
    const isCustom = opt.id.includes('Color')
    const newAgreement = isCustom ? false : true 
    onChange({ 
      ...b2bState,
      type: opt.id, minQty: opt.minQty, days: opt.days, 
      isAgreementChecked: newAgreement 
    })
  }

  const handleInstructionsChange = (text: string) => {
    if (text.length > 500) {
      showToast('Instructions too long (Max 500 chars)', 'error')
      return
    }
    onChange({ 
      ...b2bState,
      instructions: text
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 my-6 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-base font-bold text-gray-900 border-b pb-2">Select Customization & Printing</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRINTING_TIERS.map((opt) => {
            const isSelected = selectedType === opt.id
            return (
              <div
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                className={`relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-[#007185] bg-[#F0F8FF]' : 'border-gray-200 hover:border-[#007185]/50'
                }`}
              >
                {opt.tag && (
                  <span className="absolute -top-2.5 right-2 bg-[#C7511F] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                    {opt.tag}
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${isSelected ? 'text-[#007185]' : 'text-gray-900'}`}>{opt.title}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#007185]" />}
                </div>
                <div className="text-xs text-gray-600 mb-1">Min. Order: <span className="font-bold text-gray-900">{opt.minQty} qty</span></div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-auto pt-1">
                  <Truck className="w-3 h-3" />
                  <span>Ships in {opt.days} days</span>
                </div>
              </div>
            )
          })}
        </div>

        {isCustomPrint && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#C7511F]" />
              Custom Printing Requirements
            </h4>

            {activeTierConfig?.requiresArtwork && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700">Upload Logo/Artwork *</label>
                  <span className="text-[10px] text-gray-500 font-medium">{artworks.length}/{MAX_FILES} Files</span>
                </div>
                
                {/* Render Uploaded Files List */}
                {artworks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {artworks.map((file, idx) => (
                      <div key={idx} className="w-full bg-white border border-green-300 rounded-lg p-2.5 flex items-center gap-3 shadow-sm transition-all">
                        <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-green-700 leading-tight truncate">{file.name}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 border-l pl-2 ml-1 border-gray-100">
                          <button 
                            type="button"
                            onClick={() => setPreviewFile({ url: file.url, name: file.name })}
                            className="p-1.5 text-[#007185] hover:bg-[#F0F8FF] rounded-md transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveArtwork(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropzone is hidden if max files reached */}
                {artworks.length < MAX_FILES && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors shadow-sm">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-[#007185] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold text-[#007185]">Securely Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-600 mb-1"><span className="font-semibold text-[#007185]">Click to add</span> another file</p>
                          <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">PDF, PNG, AI, CDR (Max 15MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" multiple className="hidden" accept=".pdf,.png,.ai,.cdr,.jpg" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Color Codes & Special Instructions (Optional)</label>
              <textarea
                className="w-full text-sm p-3 border border-gray-300 rounded-md focus:ring-[#007185] focus:border-[#007185] shadow-sm"
                rows={2}
                placeholder="E.g., Pantone 300C. Center the logo on the front..."
                value={instructions}
                onChange={(e) => handleInstructionsChange(e.target.value)}
              />
              <div className="text-right mt-1">
                <span className={`text-[10px] ${instructions.length > 450 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {instructions.length}/500
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#FFF8E1] p-3 rounded-md border border-[#FCD200]">
              <input 
                type="checkbox" 
                id="b2b-agreement" 
                className="mt-0.5 w-4 h-4 text-[#007185] border-gray-300 rounded cursor-pointer" 
                checked={isAgreementChecked} 
                onChange={(e) => handleAgreementToggle(e.target.checked)}
              />
              <label htmlFor="b2b-agreement" className="text-xs text-gray-800 leading-tight cursor-pointer">
                <strong>I agree:</strong> 100% refund is available only <em>before</em> production begins. Custom orders cannot be returned.
              </label>
            </div>
          </div>
        )}
      </div>

      <PreviewModal 
        isOpen={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
        fileUrl={previewFile?.url || null} 
        fileName={previewFile?.name} 
      />
    </>
  )
}