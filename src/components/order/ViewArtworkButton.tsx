// src/components/order/ViewArtworkButton.tsx

'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { getSignedB2BUrl } from '@/lib/supabase/b2b-storage'
import PreviewModal from '@/components/ui/PreviewModal'

export default function ViewArtworkButton({ path }: { path: string }) {
  const [modal, setModal] = useState({ isOpen: false, url: '' })
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      const signedUrl = `/api/artwork?path=${encodeURIComponent(path)}`
      setModal({ isOpen: true, url: signedUrl })
    } catch {
      alert('Failed to load file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={handleAction}
        disabled={loading}
        className="text-[11px] font-bold text-[#007185] hover:underline flex items-center gap-1 mt-1 cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Loading...' : <><ExternalLink className="w-3 h-3" /> View/Download My Artwork</>}
      </button>
      <PreviewModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
        fileUrl={modal.url} 
        fileName={path.split('/').pop()} 
      />
    </>
  )
}