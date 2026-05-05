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
import { useProductDraftStore } from '@/store/productDraft.store'
import { useCartStore } from '@/store/cart.store'

interface ArtworkFile {
  path: string
  url: string
  name: string
  size: number
}

interface PrintingOptionsProps {
  b2bState: {
    type?: string
    printingType?: string
    minQty: number
    days: number
    instructions: string
    artworkUrls: string[]
    artworkSizes?: number[]  // 🆕 Size tracking
    artworks: ArtworkFile[]
    isAgreementChecked: boolean
  }
  onChange: (data: any) => void
}

const MAX_FILES = 3
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB per file
const MAX_TOTAL_SIZE = 15 * 1024 * 1024 // 15MB total (changed from 30MB)

export default function PrintingOptions({ b2bState, onChange }: PrintingOptionsProps) {
  const { user, isLoading } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)
  const { setRedirectedFlag } = useProductDraftStore()

  const selectedType = b2bState.printingType ?? b2bState.type ?? 'Retail (Readymade)'
  const instructions = b2bState.instructions || ''
  const artworks = b2bState.artworks || []
  const artworkSizes = b2bState.artworkSizes || []
  const isAgreementChecked = b2bState.isAgreementChecked ?? true

  const activeTierConfig = PRINTING_TIERS.find((o) => o.id === selectedType)
  const isCustomPrint = selectedType.includes('Color')

  // Helper to dynamically assign semantic colors to tags
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Best Value': return 'bg-[#007600] text-white' // Green for Savings
      case 'Fastest': return 'bg-[#007185] text-white'    // Blue for Speed/Trust
      case 'Popular': return 'bg-[#C7511F] text-white'    // Orange for Attention
      default: return 'bg-[#C7511F] text-white'
    }
  }

  // Generate a session ID for anonymous uploads
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('upload_session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('upload_session_id', sessionId)
    }
    return sessionId
  }

  useEffect(() => {
    if (user && !isLoading && typeof window !== 'undefined' && sessionStorage.getItem('pending_upload') === 'true') {
      sessionStorage.removeItem('pending_upload')
      showToast('Session restored. You can now upload your artwork.', 'success')
    }
  }, [user, isLoading])

  const handleAgreementToggle = (checked: boolean) => {
    onChange({
      ...b2bState,
      isAgreementChecked: checked,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // 🆕 Calculate current totals
    const currentFileCount = artworks.length
    const currentTotalSize = artworkSizes.reduce((sum, size) => sum + size, 0)

    if (currentFileCount + files.length > MAX_FILES) {
      showToast(`You can only upload up to ${MAX_FILES} files total. Current: ${currentFileCount}`, 'warning')
      return
    }

    const validFiles: { file: File; size: number }[] = []
    let runningTotalSize = currentTotalSize

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`"${file.name}" exceeds the 15MB limit.`, 'error')
        continue
      }
      if (runningTotalSize + file.size > MAX_TOTAL_SIZE) {
        showToast(`Total upload size cannot exceed 15MB. Current: ${(runningTotalSize / 1024 / 1024).toFixed(2)}MB`, 'error')
        break
      }
      runningTotalSize += file.size
      validFiles.push({ file, size: file.size })
    }

    if (!validFiles.length) return

    setIsUploading(true)
    try {
      const newArtworks = [...artworks]
      const newSizes = [...artworkSizes]

      for (const { file, size } of validFiles) {
        // Upload to temp folder if not logged in
        const internalPath = await uploadB2BArtwork(file, user?.id || null, getSessionId())
        const signed = await getSignedB2BUrl(internalPath)
        
        newArtworks.push({
          path: internalPath,
          url: signed || '',
          name: file.name,
          size: size,
        })
        newSizes.push(size)
      }

      onChange({
        ...b2bState,
        artworkUrls: newArtworks.map((a) => a.path),
        artworkSizes: newSizes,
        artworks: newArtworks,
      })

      showToast(`${validFiles.length} file(s) uploaded successfully`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error')
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveArtwork = async (indexToRemove: number) => {
    const artworkToRemove = artworks[indexToRemove]
    const newArtworks = artworks.filter((_, idx) => idx !== indexToRemove)
    const newSizes = artworkSizes.filter((_, idx) => idx !== indexToRemove)

    onChange({
      ...b2bState,
      artworkUrls: newArtworks.map((a) => a.path),
      artworkSizes: newSizes,
      artworks: newArtworks,
    })

    showToast('Artwork removed', 'info')

    // 🚨 FIX: Prevent deleting artwork if it is currently actively used by a Cart Item!
    const cartItems = useCartStore.getState().items
    const isInUseByCart = cartItems.some(item => item.artwork_urls?.includes(artworkToRemove.path))

    if (!isInUseByCart) {
      try {
        await deleteB2BArtwork(artworkToRemove.path)
      } catch (err) {
        console.warn('Failed to delete artwork:', err)
      }
    }
  }

  const handleOptionClick = (opt: any) => {
    const isCustom = opt.id.includes('Color')
    const newAgreement = isCustom ? false : true
    
    onChange({
      ...b2bState,
      type: opt.id,
      printingType: opt.id,
      minQty: opt.minQty,
      days: opt.days,
      isAgreementChecked: newAgreement,
    })
  }

  const handleInstructionsChange = (text: string) => {
    if (text.length > 500) {
      showToast('Instructions too long (Max 500 chars)', 'error')
      return
    }
    onChange({
      ...b2bState,
      instructions: text,
    })
  }

  const currentTotalSizeMB = (artworkSizes.reduce((sum, s) => sum + s, 0) / 1024 / 1024).toFixed(2)

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
                  isSelected
                    ? 'border-[#007185] bg-[#F0F8FF]'
                    : 'border-gray-200 hover:border-[#007185]/50'
                }`}
              >
                {opt.tag && (
                  <span className={`absolute -top-2.5 right-2 text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm tracking-wide ${getTagColor(opt.tag)}`}>
                    {opt.tag}
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${isSelected ? 'text-[#007185]' : 'text-gray-900'}`}>
                    {opt.title}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#007185]" />}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Min. Order: <span className="font-bold text-gray-900">{opt.minQty} qty</span>
                </div>
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
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {artworks.length}/{MAX_FILES} Files
                    </span>
                    {artworks.length > 0 && (
                      <span className="text-[10px] text-gray-500 ml-2">
                        ({currentTotalSizeMB} MB / 15 MB)
                      </span>
                    )}
                  </div>
                </div>

                {artworks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {artworks.map((file, idx) => (
                      <div
                        key={idx}
                        className="w-full bg-white border border-green-300 rounded-lg p-2.5 flex items-center gap-3 shadow-sm transition-all"
                      >
                        <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-green-700 leading-tight truncate">{file.name}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
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
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold text-[#007185]">Click to add</span> file
                          </p>
                          <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                            PDF, PNG, JPG (Max 15MB per file, 15MB total)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Color Codes & Special Instructions (Optional)
              </label>
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
                <strong>I agree:</strong> 100% refund is available only <em>before</em> production begins. Custom
                orders cannot be returned.
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