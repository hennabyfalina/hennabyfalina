// src/components/product/PrintingOptions.tsx

'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Truck, UploadCloud, AlertCircle, Eye, Trash2 } from 'lucide-react'
import { uploadB2BArtwork, deleteB2BArtwork } from '@/lib/supabase/b2b-storage'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'
import PreviewModal from '@/components/ui/PreviewModal'
import { useCartStore } from '@/store/cart.store'
import { compressArtwork } from '@/lib/compression'
import B2BTermsAgreement from './B2BTermsAgreement'

interface ArtworkFile {
  path: string
  url: string
  name: string
  size: number
  formattedSize?: string
}

interface PricingTier {
  tier_name: string
  mrp: number
  selling_price: number
  min_quantity: number
  requires_artwork: boolean 
  delivery_days?: number // 🚨 Added to interface
  sort_order: number
  promotional_badge?: string | null
  promotional_badge_color?: string | null
}

interface PrintingOptionsProps {
  b2bState: {
    type?: string
    printingType?: string
    minQty: number
    days: number
    instructions: string
    artworkUrls: string[]
    artworkSizes?: number[]
    artworks: ArtworkFile[]
    isArtworkRightsChecked?: boolean
    isPrintTimelineChecked?: boolean
  }
  onChange: (data: any) => void
  pricingTiers: PricingTier[] 
}

const MAX_FILES = 3
const MAX_FILE_SIZE = 15 * 1024 * 1024 
const MAX_TOTAL_SIZE = 15 * 1024 * 1024 

export default function PrintingOptions({ b2bState, onChange, pricingTiers }: PrintingOptionsProps) {
  const { user, isLoading } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  const selectedType = b2bState.printingType ?? b2bState.type ?? pricingTiers[0]?.tier_name
  const instructions = b2bState.instructions || ''
  const artworks = b2bState.artworks || []
  const artworkSizes = b2bState.artworkSizes || []
  const isArtworkRightsChecked = b2bState.isArtworkRightsChecked ?? false
  const isPrintTimelineChecked = b2bState.isPrintTimelineChecked ?? false

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const selectedTierObj = pricingTiers.find(t => t.tier_name === selectedType)
  const isCustomPrint = selectedTierObj?.requires_artwork ?? false

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const currentFileCount = artworks.length
    const currentTotalSize = artworkSizes.reduce((sum, size) => sum + size, 0)

    if (currentFileCount + files.length > MAX_FILES) {
      showToast(`You can only upload up to ${MAX_FILES} files.`, 'warning')
      return
    }

    setIsUploading(true)

    const validFiles: { file: File; size: number }[] = []
    let runningTotalSize = currentTotalSize

    for (const originalFile of files) {
      const { file: fileToUpload, size: finalSize } = await compressArtwork(originalFile)

      if (finalSize > MAX_FILE_SIZE) {
        showToast(`"${fileToUpload.name}" is too large.`, 'error')
        continue
      }
      if (runningTotalSize + finalSize > MAX_TOTAL_SIZE) {
        showToast(`Total size exceeds 15MB limit.`, 'error')
        break
      }
      runningTotalSize += finalSize
      validFiles.push({ file: fileToUpload, size: finalSize })
    }

    if (!validFiles.length) {
      setIsUploading(false)
      if (e.target) e.target.value = ''
      return
    }

    try {
      const newArtworks = [...artworks]
      const newSizes = [...artworkSizes]

      for (const { file, size } of validFiles) {
        const internalPath = await uploadB2BArtwork(file, user?.id || null, getSessionId())
        
        // 🚨 PHASE 3: Permanent Proxy URLs (Fixes the "Missing Files" bug on reload)
        const permanentProxyUrl = `/api/artwork?path=${encodeURIComponent(internalPath)}`
        
        newArtworks.push({ 
          path: internalPath, 
          url: permanentProxyUrl, 
          name: file.name, 
          size: size,
          formattedSize: formatFileSize(size)
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

    onChange({ ...b2bState, artworkUrls: newArtworks.map((a) => a.path), artworkSizes: newSizes, artworks: newArtworks })
    showToast('Artwork removed', 'info')

    const cartItems = useCartStore.getState().items
    const isInUseByCart = cartItems.some(item => item.artwork_urls?.includes(artworkToRemove.path))

    if (!isInUseByCart) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      try { await deleteB2BArtwork(artworkToRemove.path) } catch (err) {}
    }
  }

  const handleOptionClick = (tier: PricingTier) => {
    const newAgreement = tier.requires_artwork ? false : true
    
    onChange({
      ...b2bState,
      type: tier.tier_name,
      printingType: tier.tier_name,
      minQty: tier.min_quantity,
      days: tier.delivery_days ?? 7, // 🚨 Pulls dynamic days from the DB
      isArtworkRightsChecked: newAgreement,
      isPrintTimelineChecked: newAgreement,
    })
  }

  const handleInstructionsChange = (text: string) => {
    if (text.length > 500) {
      showToast('Instructions too long (Max 500 chars)', 'error')
      return
    }
    onChange({ ...b2bState, instructions: text })
  }

  return (
    <>
      <div className="flex flex-col gap-4 my-6 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-base font-bold text-gray-900 border-b pb-2">Select Customization</h3>

        <div className={`grid gap-3 ${
          pricingTiers.length === 1 
            ? 'grid-cols-1' 
            : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          {pricingTiers.map((tier) => {
            const isSelected = selectedType === tier.tier_name
            const dynamicDays = tier.delivery_days ?? 7 // 🚨 Dynamic Fallback
            
            return (
              <div
                key={tier.tier_name}
                onClick={() => handleOptionClick(tier)}
                className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-[#007185] bg-[#F0F8FF]' : 'border-gray-200 hover:border-[#007185]/50'
                } ${pricingTiers.length === 1 ? 'max-w-md' : ''}`}
              >
                {tier.promotional_badge && (
                  <span className={`absolute -top-2.5 right-2 text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm tracking-wide ${tier.promotional_badge_color || 'bg-[#C7511F] text-white'}`}>
                    {tier.promotional_badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${isSelected ? 'text-[#007185]' : 'text-gray-900'}`}>
                    {tier.tier_name}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#007185]" />}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Min. Order: <span className="font-bold text-gray-900">{tier.min_quantity} qty</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-auto pt-1">
                  <Truck className="w-3 h-3" />
                  {/* 🚨 DYNAMIC TEXT RENDERED HERE */}
                  <span>Ships in {dynamicDays} {dynamicDays === 1 ? 'day' : 'days'}</span>
                </div>
              </div>
            )
          })}
        </div>

        {isCustomPrint && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#C7511F]" />
              Custom Requirements for {selectedType}
            </h4>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700">Upload Logo/Artwork *</label>
                <div className="text-right text-[10px] text-gray-500 font-medium">
                    <span className={artworkSizes.reduce((a, b) => a + b, 0) > MAX_TOTAL_SIZE * 0.9 ? 'text-orange-600' : ''}>
                      {formatFileSize(artworkSizes.reduce((a, b) => a + b, 0))} / {formatFileSize(MAX_TOTAL_SIZE)}
                    </span>
                    <span className="mx-1.5">|</span>
                    {artworks.length}/{MAX_FILES} Files
                </div>
              </div>

              {artworks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {artworks.map((file, idx) => (
                    <div key={idx} className="w-full bg-white border border-green-300 rounded-lg p-2.5 flex items-center gap-3 shadow-sm">
                      <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-green-700 leading-tight truncate">{file.name}</p>
                        <p className="text-[10px] text-green-600/70 font-medium">{file.formattedSize || formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 border-l pl-2 ml-1 border-gray-100">
                        <button type="button" onClick={() => setPreviewFile({ url: file.url, name: file.name })} className="p-1.5 text-[#007185] hover:bg-[#F0F8FF] rounded-md transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleRemoveArtwork(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {artworks.length < MAX_FILES && (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors shadow-sm">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <span className="text-xs font-semibold text-[#007185]">Securely Uploading...</span>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600 mb-1"><span className="font-semibold text-[#007185]">Click to add</span> logo</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Max 15MB total</p>
                      </>
                    )}
                  </div>
                  <input type="file" multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Color Codes & Instructions (Optional)</label>
              <textarea className="w-full text-sm p-3 border border-gray-300 rounded-md focus:ring-[#007185] focus:border-[#007185]" rows={2} placeholder="E.g., Pantone 300C..." value={instructions} onChange={(e) => handleInstructionsChange(e.target.value)} />
            </div>

            <B2BTermsAgreement
              isArtworkRightsChecked={isArtworkRightsChecked}
              isPrintTimelineChecked={isPrintTimelineChecked}
              onChange={(key, value) => onChange({ ...b2bState, [key]: value })}
            />
          </div>
        )}
      </div>

      <PreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} fileName={previewFile?.name} />
    </>
  )
}