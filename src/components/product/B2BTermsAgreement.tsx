// src/components/product/B2BTermsAgreement.tsx

import Link from 'next/link'

interface B2BTermsAgreementProps {
  isArtworkRightsChecked: boolean
  isPrintTimelineChecked: boolean
  onChange: (key: 'isArtworkRightsChecked' | 'isPrintTimelineChecked', value: boolean) => void
}

export default function B2BTermsAgreement({ isArtworkRightsChecked, isPrintTimelineChecked, onChange }: B2BTermsAgreementProps) {
  return (
    <div className="flex flex-col gap-3 bg-[#FFF8E1] p-4 rounded-md border border-[#FCD200]">
      <div className="flex items-start gap-3">
        <input 
          type="checkbox" 
          id="b2b-rights" 
          className="mt-0.5 w-4 h-4 text-[#007185] border-gray-400 rounded cursor-pointer shrink-0" 
          checked={isArtworkRightsChecked} 
          onChange={(e) => onChange('isArtworkRightsChecked', e.target.checked)} 
        />
        <label htmlFor="b2b-rights" className="text-xs text-gray-800 leading-tight cursor-pointer">
          <strong>Legal Rights:</strong> I confirm I own or have legal authorization to use the uploaded logo/artwork. I take full responsibility for any copyright or trademark claims.
        </label>
      </div>
      <div className="flex items-start gap-3">
        <input 
          type="checkbox" 
          id="b2b-timeline" 
          className="mt-0.5 w-4 h-4 text-[#007185] border-gray-400 rounded cursor-pointer shrink-0" 
          checked={isPrintTimelineChecked} 
          onChange={(e) => onChange('isPrintTimelineChecked', e.target.checked)} 
        />
        <label htmlFor="b2b-timeline" className="text-xs text-gray-800 leading-tight cursor-pointer">
          <strong>B2B Production Terms:</strong> I understand that once production begins, <em>orders cannot be cancelled and payments are strictly non-refundable.</em> Manufacturing defects will be repaired or replaced, not refunded. 
          <span className="block mt-3 pt-2 border-t border-[#FCD200]/30">
            <strong>Read our</strong> <Link href="/terms" className="text-[#007185] hover:underline font-medium">Terms of Service</Link> and{' '}
            <Link href="/returns-refunds" className="text-[#007185] hover:underline font-medium">Refund Policy</Link>.
          </span>
        </label>
      </div>
    </div>
  )
}